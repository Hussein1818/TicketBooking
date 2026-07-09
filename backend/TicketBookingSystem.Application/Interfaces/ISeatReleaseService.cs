using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface ISeatReleaseService
{
    Task ReleaseSeatIfExpired(int seatId);
}