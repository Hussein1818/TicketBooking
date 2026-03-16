using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class CancelBookingCommand : IRequest<bool>
{
    public int BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;
    private readonly IEmailService _emailService;
    private readonly IDistributedCache _cache;

    public CancelBookingCommandHandler(
        IApplicationDbContext context,
        ITicketHubService hubService,
        IEmailService emailService,
        IDistributedCache cache)
    {
        _context = context;
        _hubService = hubService;
        _emailService = emailService;
        _cache = cache;
    }

    public async Task<bool> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .ThenInclude(s => s.Event)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == request.UserId, cancellationToken);

        if (booking == null) return false;

        if (booking.Seat.Event.EventDate <= DateTime.UtcNow || booking.Seat.Event.IsClosed)
            return false;

        booking.Seat.Status = SeatStatus.Available;
        var eventId = booking.Seat.EventId;
        var eventName = booking.Seat.Event.Name;

        var userToRefund = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserId, cancellationToken);
        if (userToRefund != null)
        {
            userToRefund.AddFunds(booking.AmountPaid);
        }

        _context.Bookings.Remove(booking);
        await _context.SaveChangesAsync(cancellationToken);

        await _cache.RemoveAsync($"Seats_Event_{eventId}", cancellationToken);

        await _hubService.SendSeatAvailableNotification(booking.SeatId);
        await _hubService.SendDashboardUpdate();

        var waitlistUser = await _context.Waitlists
            .Where(w => w.EventId == eventId)
            .OrderBy(w => w.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (waitlistUser != null)
        {
            await _emailService.SendEmailAsync(
                waitlistUser.Email,
                "Ticket Available!",
                $"A ticket just became available for {eventName} due to a cancellation. Hurry and book it now!"
            );

            _context.Waitlists.Remove(waitlistUser);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}