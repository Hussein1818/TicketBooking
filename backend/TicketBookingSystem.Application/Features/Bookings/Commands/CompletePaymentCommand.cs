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
    public int BookingId { get; set; }
    public bool Success { get; set; }
}

public class CompletePaymentCommandHandler : IRequestHandler<CompletePaymentCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;
    private readonly IEmailService _emailService;
    private readonly IEmailTemplateService _emailTemplateService;
    private readonly ITicketPdfService _ticketPdfService; 

    public CompletePaymentCommandHandler(
        IApplicationDbContext context,
        ITicketHubService hubService,
        IEmailService emailService,
        IEmailTemplateService emailTemplateService,
        ITicketPdfService ticketPdfService)
    {
        _context = context;
        _hubService = hubService;
        _emailService = emailService;
        _emailTemplateService = emailTemplateService;
        _ticketPdfService = ticketPdfService;
    }

    public async Task<bool> Handle(CompletePaymentCommand request, CancellationToken cancellationToken)
    {
        if (!request.Success) return false;

        
        var booking = await _context.Bookings
            .Include(b => b.Seat)
                .ThenInclude(s => s.Event)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null || booking.Seat.Status != SeatStatus.Locked) return false;

        booking.Seat.Status = SeatStatus.Booked;

        if (booking.AmountPaid == 0)
        {
            booking.AmountPaid = booking.Seat.Price;
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return true; 
        }

        await _hubService.SendSeatBookedNotification(booking.SeatId);
        await _hubService.SendDashboardUpdate();

        var userEmail = await _context.Users
            .Where(u => u.UserName == booking.UserId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.IsNullOrEmpty(userEmail))
        {
            var emailBody = _emailTemplateService.GetPaymentSuccessEmailTemplate(
                booking.UserId,
                booking.Seat.SeatNumber,
                booking.AmountPaid);

           
            byte[] ticketPdfBytes = await _ticketPdfService.GenerateTicketPdfAsync(
                eventName: booking.Seat.Event.Name,
                venue: booking.Seat.Event.Venue,
                date: booking.Seat.Event.EventDate.ToString("f"), 
                seatNumber: booking.Seat.SeatNumber,
                username: booking.UserId,
                ticketId: booking.Id.ToString()
            );

            try
            {
                
                await _emailService.SendEmailWithAttachmentAsync(
                    userEmail,
                    "Hussein Stadium - Official Ticket 🎟️",
                    emailBody,
                    ticketPdfBytes,
                    $"Ticket_{booking.Seat.SeatNumber}.pdf");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email Failed to {userEmail}: {ex.Message}");
            }
        }

        return true;
    }
}