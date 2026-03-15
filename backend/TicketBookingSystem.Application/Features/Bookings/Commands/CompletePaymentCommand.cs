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

    public CompletePaymentCommandHandler(IApplicationDbContext context, ITicketHubService hubService, IEmailService emailService)
    {
        _context = context;
        _hubService = hubService;
        _emailService = emailService;
    }

    public async Task<bool> Handle(CompletePaymentCommand request, CancellationToken cancellationToken)
    {
        if (!request.Success) return false;

        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null || booking.Seat.Status != SeatStatus.Locked) return false;

        booking.Seat.Status = SeatStatus.Booked;

        if (booking.AmountPaid == 0)
        {
            booking.AmountPaid = booking.Seat.Price;
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _hubService.SendSeatBookedNotification(booking.SeatId);
        await _hubService.SendDashboardUpdate();

        var userEmail = await _context.Users
            .Where(u => u.UserName == booking.UserId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.IsNullOrEmpty(userEmail))
        {
            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f7f6;'>
                    <div style='background-color: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                        <h2 style='color: #27ae60;'>🎟️ Payment Successful!</h2>
                        <p style='color: #34495e; font-size: 16px;'>Hello <b>{booking.UserId}</b>,</p>
                        <p style='color: #7f8c8d;'>Your ticket for Hussein Stadium has been officially reserved.</p>
                        <div style='margin: 20px 0; padding: 15px; border-left: 5px solid #27ae60; background-color: #f9f9f9; text-align: left;'>
                            <p style='margin: 5px 0;'><b>Seat Number:</b> <span style='color: #e74c3c; font-weight: bold;'>{booking.Seat.SeatNumber}</span></p>
                            <p style='margin: 5px 0;'><b>Amount Paid:</b> {booking.AmountPaid} EGP</p>
                        </div>
                        <p style='color: #34495e;'>You can download your Official PDF Ticket with the QR Code directly from the website.</p>
                        <p style='color: #7f8c8d; font-size: 12px; margin-top: 20px;'>Thank you for choosing Hussein Stadium.</p>
                    </div>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(userEmail, "Hussein Stadium - Official Ticket 🎟️", emailBody);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email Failed to {userEmail}: {ex.Message}");
            }
        }

        return true;
    }
}