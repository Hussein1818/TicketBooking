using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class EventCleanupService : IEventCleanupService
{
    private readonly IApplicationDbContext _context;

    public EventCleanupService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task CloseExpiredEventsAsync()
    {
        var expiredEvents = await _context.Events
            .Where(e => e.EventDate < DateTime.UtcNow && !e.IsClosed)
            .ToListAsync(CancellationToken.None);

        if (expiredEvents.Any())
        {
            foreach (var ev in expiredEvents)
            {
                ev.UpdateDetails(
                    ev.Name,
                    ev.EventDate,
                    ev.Venue,
                    true,
                    ev.MaxTicketsPerUser,
                    ev.Category,
                    ev.ImageUrl,
                    ev.TicketPrice,
                    ev.FullRefundDays,
                    ev.PartialRefundDays,
                    ev.PartialRefundPercentage);
            }

            await _context.SaveChangesAsync(CancellationToken.None);
        }
    }
}