using Microsoft.AspNetCore.SignalR;
using TicketBookingSystem.Api.Hubs;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Api.Hubs;

namespace TicketBookingSystem.Infrastructure.Services;

public class TicketHubService : ITicketHubService
{
    private readonly IHubContext<TicketHub> _hubContext;

    public TicketHubService(IHubContext<TicketHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendSeatBookedNotification(int seatId)
    {
        await _hubContext.Clients.All.SendAsync("SeatBooked", seatId);
    }

    public async Task SendSeatLockedNotification(int seatId)
    {
        await _hubContext.Clients.All.SendAsync("SeatLocked", seatId);
    }

    public async Task SendSeatAvailableNotification(int seatId)
    {
        await _hubContext.Clients.All.SendAsync("SeatAvailable", seatId);
    }
    public async Task SendSeatLockedNotification(int seatId, DateTime expiresAt)
    {
        await _hubContext.Clients.All.SendAsync("SeatLocked", seatId, expiresAt.ToString("o"));
    }
    public async Task SendDashboardUpdate()
    {
        await _hubContext.Clients.All.SendAsync("DashboardUpdate");
    }
}