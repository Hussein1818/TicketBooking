using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Infrastructure.Services;

public class SeatReleaseService : ISeatReleaseService
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;

    public SeatReleaseService(IApplicationDbContext context, ITicketHubService hubService)
    {
        _context = context;
        _hubService = hubService;
    }

    public async Task ReleaseSeatIfExpired(int seatId)
    {
        var seat = await _context.Seats.FirstOrDefaultAsync(s => s.Id == seatId);

        if (seat != null && seat.Status == SeatStatus.Locked)
        {
            seat.Status = SeatStatus.Available;
            await _context.SaveChangesAsync(CancellationToken.None);
            await _hubService.SendSeatAvailableNotification(seat.Id);
        }
    }
}