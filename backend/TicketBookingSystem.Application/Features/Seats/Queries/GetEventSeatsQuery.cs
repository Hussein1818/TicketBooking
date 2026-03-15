using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.DTOs;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;

namespace TicketBookingSystem.Application.Features.Seats.Queries;

public class GetEventSeatsQuery : IRequest<List<SeatDto>>
{
    public int EventId { get; set; }
}

public class GetEventSeatsQueryHandler : IRequestHandler<GetEventSeatsQuery, List<SeatDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;

    public GetEventSeatsQueryHandler(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<SeatDto>> Handle(GetEventSeatsQuery request, CancellationToken cancellationToken)
    {
        
        var cacheKey = $"Seats_Event_{request.EventId}";

       
        if (!_cache.TryGetValue(cacheKey, out List<SeatDto>? seats))
        {
            
            var eventExists = await _context.Events.AnyAsync(e => e.Id == request.EventId, cancellationToken);
            if (!eventExists)
            {
                throw new NotFoundException(nameof(Event), request.EventId);
            }

            seats = await _context.Seats
                .Where(s => s.EventId == request.EventId)
                .Select(s => new SeatDto
                {
                    Id = s.Id,
                    SeatNumber = s.SeatNumber,
                    Price = s.Price,
                    Status = s.Status.ToString()
                })
                .ToListAsync(cancellationToken);

           
            _cache.Set(cacheKey, seats, TimeSpan.FromSeconds(2));
        }

        
        return seats!;
    }
}