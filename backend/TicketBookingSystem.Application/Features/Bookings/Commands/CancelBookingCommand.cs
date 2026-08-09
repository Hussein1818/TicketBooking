using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class CancelBookingCommand : IRequest<bool>
{
    public int BookingId { get; set; }

    [JsonIgnore]
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

        var eventId = booking.Seat.EventId;
        var eventName = booking.Seat.Event.Name;

        if (booking.Seat.Status == SeatStatus.Booked)
        {
            var daysUntilEvent = (booking.Seat.Event.EventDate - DateTime.UtcNow).TotalDays;
            decimal refundAmount = 0;

            if (daysUntilEvent >= booking.Seat.Event.FullRefundDays)
            {
                refundAmount = booking.AmountPaid;
            }
            else if (daysUntilEvent >= booking.Seat.Event.PartialRefundDays)
            {
                refundAmount = booking.AmountPaid * (booking.Seat.Event.PartialRefundPercentage / 100m);
            }

            if (refundAmount > 0)
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
                if (user != null)
                {
                    user.AddFunds(refundAmount);

                    if (booking.AmountPaid > 0)
                    {
                        int pointsToDeduct = (int)(booking.AmountPaid / 10);
                        user.DeductLoyaltyPoints(pointsToDeduct);
                    }

                    _context.AuditLogs.Add(new AuditLog
                    {
                        Username = user.UserName ?? string.Empty,
                        Action = "Refund Issued",
                        Details = $"Refunded {refundAmount} to wallet for Booking {booking.Id}. Deducted loyalty points."
                    });
                }
            }
        }

        booking.Seat.Status = SeatStatus.Available;
        _context.Bookings.Remove(booking);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }

        await _cache.RemoveAsync($"Seats_Event_{eventId}", cancellationToken);

        await _hubService.SendSeatAvailableNotification(booking.SeatId);
        await _hubService.SendDashboardUpdate();

        var waitlistUser = await _context.Waitlists
            .Where(w => w.EventId == eventId)
            .OrderBy(w => w.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (waitlistUser != null)
        {
            string alertMessage = $"A ticket just became available for {eventName} due to a cancellation. Hurry and book it now!";
            await _emailService.SendEmailAsync(waitlistUser.Email, "Ticket Available!", alertMessage);

            var notification = new Notification
            {
                UserId = waitlistUser.UserId,
                Message = alertMessage,
                Type = "WaitlistAlert",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            _context.Waitlists.Remove(waitlistUser);

            await _context.SaveChangesAsync(cancellationToken);
            await _hubService.SendUserNotification(waitlistUser.UserId, alertMessage, "WaitlistAlert");
        }

        return true;
    }
}