using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface IFanIdPdfService
{
    Task<byte[]> GenerateFanIdPdfAsync(string fullName, string fanIdNumber, string nationalId, string profilePicPath);
}