using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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

    public BookSeatCommandHandler(IApplicationDbContext context, ITicketHubService hubService, ICurrentUserService currentUserService)
    {
        _context = context;
        _hubService = hubService;
        _currentUserService = currentUserService;
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

        if (seat.Event.EventDate <= DateTime.UtcNow || seat.Event.IsClosed)
            throw new BadRequestException("The event is closed.");

        if (seat.Status != SeatStatus.Available)
            throw new BadRequestException("Seat is not available.");

        var userTicketsCount = await _context.Bookings
            .Include(b => b.Seat)
            .Where(b => b.UserId == currentUserId && b.Seat.EventId == seat.EventId && (b.Seat.Status == SeatStatus.Booked || b.Seat.Status == SeatStatus.Locked))
            .CountAsync(cancellationToken);

        if (userTicketsCount >= seat.Event.MaxTicketsPerUser)
            throw new BadRequestException($"Limit Reached! You can only book up to {seat.Event.MaxTicketsPerUser} ticket(s) for this event.");

        seat.Status = SeatStatus.Locked;

        var booking = new Booking
        {
            SeatId = seat.Id,
            UserId = currentUserId,
            BookingDate = DateTime.UtcNow,
            AmountPaid = 0
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

        var lockDuration = TimeSpan.FromMinutes(5);
        var expiresAt = DateTime.UtcNow.Add(lockDuration);

        await _hubService.SendSeatLockedNotification(seat.Id, expiresAt);
        await _hubService.SendDashboardUpdate();

        return booking.Id;
    }
}