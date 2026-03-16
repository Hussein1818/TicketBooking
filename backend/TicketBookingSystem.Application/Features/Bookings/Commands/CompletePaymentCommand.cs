using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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

    public CompletePaymentCommandHandler(
        IApplicationDbContext context,
        ITicketHubService hubService,
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ITicketPdfService ticketPdfService,
        IJobService jobService)
    {
        _context = context;
        _hubService = hubService;
        _emailService = emailService;
        _emailTemplateService = emailTemplateService;
        _ticketPdfService = ticketPdfService;
        _jobService = jobService;
    }

    public async Task<bool> Handle(CompletePaymentCommand request, CancellationToken cancellationToken)
    {
        if (!request.Success) return false;

        var order = await _context.Orders
            .Include(o => o.Bookings)
                .ThenInclude(b => b.Seat)
                    .ThenInclude(s => s.Event)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null || order.Status == "Paid") return false;

        order.Status = "Paid";

        foreach (var booking in order.Bookings)
        {
            if (booking.Seat.Status == SeatStatus.Locked)
            {
                booking.Seat.Status = SeatStatus.Booked;

                if (!string.IsNullOrEmpty(booking.JobId))
                {
                    _jobService.CancelJob(booking.JobId);
                }
            }
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return true;
        }

        foreach (var booking in order.Bookings)
        {
            await _hubService.SendSeatBookedNotification(booking.SeatId);
        }
        await _hubService.SendDashboardUpdate();

        var userEmail = await _context.Users
            .Where(u => u.UserName == order.UserId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.IsNullOrEmpty(userEmail))
        {
            foreach (var booking in order.Bookings)
            {
                var emailBody = _emailTemplateService.GetPaymentSuccessEmailTemplate(
                    order.UserId,
                    booking.Seat.SeatNumber,
                    booking.AmountPaid);

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
                        $"Hussein Stadium - Official Ticket (Seat {booking.Seat.SeatNumber})",
                        emailBody,
                        ticketPdfBytes,
                        $"Ticket_{booking.Seat.SeatNumber}.pdf");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Email Failed to {userEmail}: {ex.Message}");
                }
            }
        }

        return true;
    }
}