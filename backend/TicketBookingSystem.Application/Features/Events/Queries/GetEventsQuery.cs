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

public class GetEventsQuery : IRequest<PagedResult<EventDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}


public class EventDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, PagedResult<EventDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;

    public GetEventsQueryHandler(IApplicationDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PagedResult<EventDto>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, 50);

        var cacheKey = $"Events_Page_{page}_Size_{pageSize}";

        
        var cachedEvents = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedEvents))
        {
            return JsonSerializer.Deserialize<PagedResult<EventDto>>(cachedEvents)!;
        }

        var query = _context.Events.AsNoTracking()
            .OrderByDescending(e => e.EventDate);

        int totalCount = await query.CountAsync(cancellationToken);

        var events = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EventDto
            {
                Id = e.Id,
                Name = e.Name,
                EventDate = e.EventDate,
                Venue = e.Venue,
                IsClosed = e.IsClosed,
                MaxTicketsPerUser = e.MaxTicketsPerUser,
                Category = e.Category,
                ImageUrl = e.ImageUrl
            })
            .ToListAsync(cancellationToken);

        var result = new PagedResult<EventDto>
        {
            Items = events,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions, cancellationToken);

        return result;
    }
}