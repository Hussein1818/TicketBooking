using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Events.Commands;

public class ManageEventCommand : IRequest<bool>
{
    public int EventId { get; set; }
    public bool? CloseEvent { get; set; }
    public decimal? NewPrice { get; set; }
    public int? AdditionalSeats { get; set; }
}

public class ManageEventCommandHandler : IRequestHandler<ManageEventCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;

    public ManageEventCommandHandler(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<bool> Handle(ManageEventCommand request, CancellationToken cancellationToken)
    {
        var ev = await _context.Events.FindAsync(new object[] { request.EventId }, cancellationToken);
        if (ev == null) throw new NotFoundException(nameof(Event), request.EventId);

        if (request.CloseEvent.HasValue && request.CloseEvent.Value)
        {
            ev.IsClosed = true;
        }

        if (request.NewPrice.HasValue)
        {
            var availableSeats = await _context.Seats
                .Where(s => s.EventId == request.EventId && s.Status == SeatStatus.Available)
                .ToListAsync(cancellationToken);

            foreach (var seat in availableSeats)
            {
                seat.Price = request.NewPrice.Value;
            }
        }

        if (request.AdditionalSeats.HasValue && request.AdditionalSeats.Value > 0)
        {
            var currentMaxSeatNumber = await _context.Seats
                .Where(s => s.EventId == request.EventId)
                .CountAsync(cancellationToken);

            var priceToUse = request.NewPrice ??
                            (await _context.Seats.FirstOrDefaultAsync(s => s.EventId == request.EventId, cancellationToken))?.Price ?? 100;

            var newSeats = new List<Seat>();
            for (int i = 1; i <= request.AdditionalSeats.Value; i++)
            {
                newSeats.Add(new Seat
                {
                    EventId = request.EventId,
                    SeatNumber = $"S-{currentMaxSeatNumber + i}-{System.Guid.NewGuid().ToString().Substring(0, 4)}",
                    Price = priceToUse,
                    Status = SeatStatus.Available
                });
            }
            _context.Seats.AddRange(newSeats);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _cache.Remove($"Seats_Event_{request.EventId}");

        return true;
    }
}