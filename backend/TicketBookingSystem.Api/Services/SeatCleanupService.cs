using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Api.Services;

public class SeatCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public SeatCleanupService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                var hubService = scope.ServiceProvider.GetRequiredService<ITicketHubService>();

                var expirationTime = DateTime.UtcNow.AddMinutes(-5);

                var expiredBookings = await context.Bookings
                    .Include(b => b.Seat)
                    .Where(b => b.Seat.Status == SeatStatus.Locked && b.AmountPaid == 0 && b.BookingDate <= expirationTime)
                    .ToListAsync(cancellationToken: stoppingToken);

                if (expiredBookings.Any())
                {
                    foreach (var booking in expiredBookings)
                    {
                        booking.Seat.Status = SeatStatus.Available;
                        context.Bookings.Remove(booking);
                        await hubService.SendSeatAvailableNotification(booking.SeatId);
                    }

                    await context.SaveChangesAsync(stoppingToken);
                    await hubService.SendDashboardUpdate();
                }
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}