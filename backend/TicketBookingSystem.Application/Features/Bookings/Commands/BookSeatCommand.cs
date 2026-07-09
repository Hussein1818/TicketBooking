using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Linq;
using System.Text.Json.Serialization;
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

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
}

public class BookSeatCommandHandler : IRequestHandler<BookSeatCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;
    private readonly IJobService _jobService;
    private readonly IDistributedCache _cache;

    public BookSeatCommandHandler(
        IApplicationDbContext context,
        ITicketHubService hubService,
        IJobService jobService,
        IDistributedCache cache)
    {
        _context = context;
        _hubService = hubService;
        _jobService = jobService;
        _cache = cache;
    }

    public async Task<int> Handle(BookSeatCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = request.UserId;

        var seat = await _context.Seats
            .Include(s => s.Event)
            .FirstOrDefaultAsync(s => s.Id == request.SeatId, cancellationToken);

        if (seat == null) throw new NotFoundException(nameof(Seat), request.SeatId);
        if (seat.Event.IsClosed) throw new BadRequestException("This event is closed for booking.");
        if (seat.Status != SeatStatus.Available) throw new ConflictException("Seat is not available.");

        var userTicketsCount = await _context.Bookings
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
            _jobService.CancelJob(jobId);
            throw new ConflictException("This seat was just booked by someone else. Please choose another seat.");
        }

        await _cache.RemoveAsync($"Seats_Event_{seat.EventId}", cancellationToken);
        await _hubService.SendSeatLockedNotification(seat.Id, expiresAt);

        return booking.Id;
    }
}