using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Seats.Queries;

public class GetEventSeatsQuery : IRequest<List<SeatDto>>
{
    public int EventId { get; set; }
}

public class SeatDto
{
    public int Id { get; set; }
    public string SeatNumber { get; set; }
    public decimal Price { get; set; }
    public string Status { get; set; }
}

public class GetEventSeatsQueryHandler : IRequestHandler<GetEventSeatsQuery, List<SeatDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;

    public GetEventSeatsQueryHandler(IApplicationDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<SeatDto>> Handle(GetEventSeatsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"Seats_Event_{request.EventId}";

        
        var cachedSeats = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedSeats))
        {
            return JsonSerializer.Deserialize<List<SeatDto>>(cachedSeats)!;
        }

       
        var eventExists = await _context.Events.AsNoTracking().AnyAsync(e => e.Id == request.EventId, cancellationToken);
        if (!eventExists) throw new TicketBookingSystem.Application.Exceptions.NotFoundException(nameof(Domain.Entities.Event), request.EventId);

        var seats = await _context.Seats.AsNoTracking()
            .Where(s => s.EventId == request.EventId)
            .Select(s => new SeatDto
            {
                Id = s.Id,
                SeatNumber = s.SeatNumber,
                Price = s.Price,
                Status = s.Status.ToString()
            })
            .ToListAsync(cancellationToken);

       
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(seats), cacheOptions, cancellationToken);

        return seats;
    }
}