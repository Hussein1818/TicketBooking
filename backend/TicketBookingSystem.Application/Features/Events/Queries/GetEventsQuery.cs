using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TicketBookingSystem.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Events.Queries;

public class GetEventsQuery : IRequest<PaginatedEventResult>
{
    public string? SearchTerm { get; set; }
    public string? Category { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 6;
}

public class PaginatedEventResult
{
    public List<EventDto> Events { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
}

public class EventDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsExpired { get; set; }
    public bool IsClosed { get; set; }
}

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, PaginatedEventResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;

    public GetEventsQueryHandler(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PaginatedEventResult> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var searchTerm = request.SearchTerm?.Trim().ToLower() ?? "";
        var category = request.Category?.Trim() ?? "All";

        var cacheKey = $"Events_{searchTerm}_{category}_{request.PageNumber}_{request.PageSize}";

        if (!_cache.TryGetValue(cacheKey, out PaginatedEventResult cachedResult))
        {
            var query = _context.Events.AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(e => e.Name.ToLower().Contains(searchTerm));
            }

            if (category != "All")
            {
                query = query.Where(e => e.Category == category);
            }

            var totalCount = await query.CountAsync(cancellationToken);
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            var events = await query
                .OrderByDescending(e => e.EventDate)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(e => new EventDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    EventDate = e.EventDate,
                    Venue = e.Venue,
                    Category = e.Category,
                    IsExpired = e.EventDate <= DateTime.UtcNow,
                    IsClosed = e.IsClosed
                })
                .ToListAsync(cancellationToken);

            cachedResult = new PaginatedEventResult
            {
                Events = events,
                TotalCount = totalCount,
                TotalPages = totalPages,
                CurrentPage = request.PageNumber
            };

            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromSeconds(30));

            _cache.Set(cacheKey, cachedResult, cacheOptions);
        }

        return cachedResult;
    }
}