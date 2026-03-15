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

namespace TicketBookingSystem.Application.Features.Events.Queries;

public class GetEventsQuery : IRequest<List<EventDto>>
{
}


public class EventDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateTime EventDate { get; set; }
    public string Venue { get; set; }
    public bool IsClosed { get; set; }
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; }
}

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, List<EventDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;

    public GetEventsQueryHandler(IApplicationDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<EventDto>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = "Events_List";

        
        var cachedEvents = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedEvents))
        {
            return JsonSerializer.Deserialize<List<EventDto>>(cachedEvents)!;
        }

        
        var events = await _context.Events
            .Select(e => new EventDto
            {
                Id = e.Id,
                Name = e.Name,
                EventDate = e.EventDate,
                Venue = e.Venue,
                IsClosed = e.IsClosed,
                MaxTicketsPerUser = e.MaxTicketsPerUser,
                Category = e.Category
            })
            .ToListAsync(cancellationToken);

        
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(events), cacheOptions, cancellationToken);

        return events;
    }
}