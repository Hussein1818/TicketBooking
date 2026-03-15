using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class EmailTemplateService : IEmailTemplateService
{
    public string GetPaymentSuccessEmailTemplate(string username, string seatNumber, decimal amountPaid)
    {
        return $@"
            <div style='font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f7f6;'>
                <div style='background-color: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.1);'>
                    <h2 style='color: #27ae60;'>🎟️ Payment Successful!</h2>
                    <p style='color: #34495e; font-size: 16px;'>Hello <b>{username}</b>,</p>
                    <p style='color: #7f8c8d;'>Your ticket for Hussein Stadium has been officially reserved.</p>
                    <div style='margin: 20px 0; padding: 15px; border-left: 5px solid #27ae60; background-color: #f9f9f9; text-align: left;'>
                        <p style='margin: 5px 0;'><b>Seat Number:</b> <span style='color: #e74c3c; font-weight: bold;'>{seatNumber}</span></p>
                        <p style='margin: 5px 0;'><b>Amount Paid:</b> {amountPaid} EGP</p>
                    </div>
                    <p style='color: #34495e;'>You can download your Official PDF Ticket with the QR Code directly from the website.</p>
                    <p style='color: #7f8c8d; font-size: 12px; margin-top: 20px;'>Thank you for choosing Hussein Stadium.</p>
                </div>
            </div>";
    }
}