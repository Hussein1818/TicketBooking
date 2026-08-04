using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Events;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Events.Queries;

public class GetEventsQuery : IRequest<PagedResult<EventDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Category { get; set; }
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
        var cacheKey = $"Events_Page_{request.Page}_Size_{request.PageSize}_Cat_{request.Category ?? "ALL"}";

        try
        {
            var cachedEvents = await _cache.GetStringAsync(cacheKey, cancellationToken);
            if (!string.IsNullOrEmpty(cachedEvents))
            {
                var deserializedResult = JsonSerializer.Deserialize<PagedResult<EventDto>>(cachedEvents);
                if (deserializedResult != null) return deserializedResult;
            }
        }
        catch (Exception)
        {
        }

        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _context.Events.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Category) && request.Category.ToLower() != "null")
        {
            query = query.Where(e => e.Category.ToLower() == request.Category.ToLower());
        }

        query = query.OrderByDescending(e => e.EventDate);

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
                ImageUrl = e.ImageUrl,
                TicketPrice = e.TicketPrice,
                AttendingCount = e.Seats.Count(s => s.Status == SeatStatus.Booked)
            })
            .ToListAsync(cancellationToken);

        var result = new PagedResult<EventDto>
        {
            Items = events,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        try
        {
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), cacheOptions, cancellationToken);
        }
        catch (Exception)
        {
           
        }

        return result;
    }
}