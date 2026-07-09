using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class CompletePaymentCommand : IRequest<bool>
{
    public int OrderId { get; set; }
    public bool Success { get; set; }
}

public class CompletePaymentCommandHandler : IRequestHandler<CompletePaymentCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;
    private readonly IEmailService _emailService;
    private readonly IEmailTemplateService _emailTemplateService;
    private readonly ITicketPdfService _ticketPdfService;
    private readonly IJobService _jobService;
    private readonly IPricingService _pricingService;
    private readonly ILogger<CompletePaymentCommandHandler> _logger;

    public CompletePaymentCommandHandler(
        IApplicationDbContext context,
        ITicketHubService hubService,
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ITicketPdfService ticketPdfService,
        IJobService jobService,
        IPricingService pricingService,
        ILogger<CompletePaymentCommandHandler> logger)
    {
        _context = context;
        _hubService = hubService;
        _emailService = emailService;
        _emailTemplateService = emailTemplateService;
        _ticketPdfService = ticketPdfService;
        _jobService = jobService;
        _pricingService = pricingService;
        _logger = logger;
    }

    public async Task<bool> Handle(CompletePaymentCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.Bookings)
            .ThenInclude(b => b.Seat)
            .ThenInclude(s => s.Event)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null || order.Status == "Paid")
            return false;

        if (!request.Success)
        {
            order.Status = "Failed";

            foreach (var booking in order.Bookings)
            {
                booking.Seat.Status = SeatStatus.Available;
                if (!string.IsNullOrEmpty(booking.JobId))
                {
                    _jobService.CancelJob(booking.JobId);
                }

                await _hubService.SendSeatAvailableNotification(booking.SeatId);
            }

            _context.Bookings.RemoveRange(order.Bookings);
            await _context.SaveChangesAsync(cancellationToken);
            return false;
        }

        order.Status = "Paid";

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == order.UserId, cancellationToken);
        if (user != null)
        {
            int pointsToAward = (int)(order.TotalAmount / 10);
            user.AddLoyaltyPoints(pointsToAward);
            _context.AuditLogs.Add(new AuditLog { Username = user.UserName ?? string.Empty, Action = "Loyalty Points", Details = $"Earned {pointsToAward} points." });
        }

        foreach (var booking in order.Bookings)
        {
            booking.Seat.Status = SeatStatus.Booked;
            _pricingService.ApplyRevenueSplit(booking);

            if (!string.IsNullOrEmpty(booking.JobId))
            {
                _jobService.CancelJob(booking.JobId);
            }

            await _hubService.SendSeatBookedNotification(booking.SeatId);
        }

        await _context.SaveChangesAsync(cancellationToken);
        await _hubService.SendDashboardUpdate();

        if (user != null)
        {
            var userEmail = user.Email;
            if (string.IsNullOrEmpty(userEmail)) return true;

            foreach (var booking in order.Bookings)
            {
                string emailBody = _emailTemplateService.GetPaymentSuccessEmailTemplate(
                    order.UserId,
                    booking.Seat.SeatNumber,
                    booking.AmountPaid,
                    booking.Seat.Event.Name);

                byte[] ticketPdfBytes = await _ticketPdfService.GenerateTicketPdfAsync(
                    eventName: booking.Seat.Event.Name,
                    venue: booking.Seat.Event.Venue,
                    date: booking.Seat.Event.EventDate.ToString("f"),
                    seatNumber: booking.Seat.SeatNumber,
                    username: order.UserId,
                    seatId: booking.SeatId
                );

                try
                {
                    await _emailService.SendEmailWithAttachmentAsync(
                        userEmail,
                        $"Your Official Ticket (Seat {booking.Seat.SeatNumber})",
                        emailBody,
                        ticketPdfBytes,
                        $"Ticket_{booking.Seat.SeatNumber}.pdf");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send ticket email to {Email} for Order {OrderId}, Seat {SeatNumber}",
                        userEmail, request.OrderId, booking.Seat.SeatNumber);
                }
            }
        }

        return true;
    }
}