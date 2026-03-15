using MediatR;
using Microsoft.EntityFrameworkCore;
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

    public CancelBookingCommandHandler(IApplicationDbContext context, ITicketHubService hubService, IEmailService emailService)
    {
        _context = context;
        _hubService = hubService;
        _emailService = emailService;
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

        await _hubService.SendSeatAvailableNotification(booking.SeatId);
        await _hubService.SendDashboardUpdate();

        var waitlistUsers = await _context.Waitlists
            .Where(w => w.EventId == eventId)
            .ToListAsync(cancellationToken);

        if (waitlistUsers.Any())
        {
            var emailTasks = waitlistUsers.Select(w => _emailService.SendEmailAsync(
                w.Email,
                "Ticket Available! 🎟️",
                $"A ticket just became available for {eventName} due to a cancellation. Hurry and book it now!"
            ));
            await Task.WhenAll(emailTasks);

            _context.Waitlists.RemoveRange(waitlistUsers);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}