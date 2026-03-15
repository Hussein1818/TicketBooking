using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface ITicketPdfService
{
    
    Task<byte[]> GenerateTicketPdfAsync(string eventName, string venue, string date, string seatNumber, string username, string ticketId);
}