namespace TicketBookingSystem.Application.Interfaces;

public interface IJobService
{
    void ScheduleSeatRelease(int seatId, TimeSpan delay);
}