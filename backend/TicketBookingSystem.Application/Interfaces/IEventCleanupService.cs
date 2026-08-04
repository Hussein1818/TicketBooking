using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface IEventCleanupService
{
    Task CloseExpiredEventsAsync();
}