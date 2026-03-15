namespace TicketBookingSystem.Application.Interfaces;

public interface IPaymentService
{
    Task<string> GetPaymentUrlAsync(int bookingId, decimal amount, string currency = "EGP");
}