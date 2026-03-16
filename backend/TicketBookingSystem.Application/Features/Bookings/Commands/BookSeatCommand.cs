using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class BookSeatCommand : IRequest<int>
{
    public int SeatId { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class BookSeatCommandHandler : IRequestHandler<BookSeatCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IJobService _jobService;
    private readonly IDistributedCache _cache;

    public BookSeatCommandHandler(
        IApplicationDbContext context,
        ITicketHubService hubService,
        ICurrentUserService currentUserService,
        IJobService jobService,
        IDistributedCache cache)
    {
        _context = context;
        _hubService = hubService;
        _currentUserService = currentUserService;
        _jobService = jobService;
        _cache = cache;
    }

    public async Task<int> Handle(BookSeatCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.Username;
        if (string.IsNullOrEmpty(currentUserId))
            throw new UnauthorizedAccessException("User not authenticated.");

        var seat = await _context.Seats
            .Include(s => s.Event)
            .FirstOrDefaultAsync(s => s.Id == request.SeatId, cancellationToken);

        if (seat == null)
            throw new NotFoundException(nameof(Seat), request.SeatId);

        if (seat.Event.IsClosed || seat.Event.EventDate <= DateTime.UtcNow)
            throw new BadRequestException("Event is closed or already past.");

        if (seat.Status != SeatStatus.Available)
            throw new BadRequestException("Seat is not available.");

        var userTicketsCount = await _context.Bookings
            .Include(b => b.Seat)
            .Where(b => b.UserId == currentUserId && b.Seat.EventId == seat.EventId && (b.Seat.Status == SeatStatus.Booked || b.Seat.Status == SeatStatus.Locked))
            .CountAsync(cancellationToken);

        if (userTicketsCount >= seat.Event.MaxTicketsPerUser)
            throw new BadRequestException($"Limit Reached! You can only book up to {seat.Event.MaxTicketsPerUser} ticket(s) for this event.");

        seat.Status = SeatStatus.Locked;

        var lockDuration = TimeSpan.FromMinutes(AppConstants.SeatLockDurationMinutes);
        var expiresAt = DateTime.UtcNow.Add(lockDuration);

        var jobId = _jobService.ScheduleSeatRelease(seat.Id, lockDuration);

        var booking = new Booking
        {
            SeatId = seat.Id,
            UserId = currentUserId,
            BookingDate = DateTime.UtcNow,
            AmountPaid = 0,
            JobId = jobId
        };

        _context.Bookings.Add(booking);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("This seat was just booked by someone else. Please choose another seat.");
        }

        await _cache.RemoveAsync($"Seats_Event_{seat.EventId}", cancellationToken);

        await _hubService.SendSeatLockedNotification(seat.Id, expiresAt);
        await _hubService.SendDashboardUpdate();

        return booking.Id;
    }
}