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
        
        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .FirstOrDefaultAsync(b => b.SeatId == seatId && b.Seat.Status == SeatStatus.Locked && b.AmountPaid == 0);

        if (booking != null)
        {
            
            booking.Seat.Status = SeatStatus.Available;

            
            _context.Bookings.Remove(booking);

            await _context.SaveChangesAsync(CancellationToken.None);

            
            await _hubService.SendSeatAvailableNotification(seatId);
            await _hubService.SendDashboardUpdate();
        }
    }
}