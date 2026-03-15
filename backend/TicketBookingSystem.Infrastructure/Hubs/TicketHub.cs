using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TicketBookingSystem.Infrastructure.Hubs;

[Authorize]
public class TicketHub : Hub
{
    
}