namespace TicketBookingSystem.Application.Interfaces;

public interface IEmailTemplateService
{
    string GetPaymentSuccessEmailTemplate(string username, string seatNumber, decimal amountPaid);
}