namespace TicketBookingSystem.Application.Interfaces;

public interface ITicketHubService
{
    Task SendSeatBookedNotification(int seatId);


    Task SendSeatLockedNotification(int seatId, DateTime expiresAt);
    Task SendSeatAvailableNotification(int seatId);
    Task SendDashboardUpdate();
}