using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Events.Queries;

public class GetEventAnalyticsQuery : IRequest<EventAnalyticsDto>
{
    public int EventId { get; set; }
}

public class EventAnalyticsDto
{
    public int EventId { get; set; }
    public decimal TotalNetRevenue { get; set; }
    public int TicketsSold { get; set; }
    public int RemainingTickets { get; set; }
    public int TotalCapacity { get; set; }
    public string Velocity { get; set; } = string.Empty;
}

public class GetEventAnalyticsQueryHandler : IRequestHandler<GetEventAnalyticsQuery, EventAnalyticsDto>
{
    private readonly IApplicationDbContext _context;

    public GetEventAnalyticsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EventAnalyticsDto> Handle(GetEventAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var eventEntity = await _context.Events
            .Include(e => e.Seats)
            .FirstOrDefaultAsync(e => e.Id == request.EventId, cancellationToken);

        if (eventEntity == null)
            throw new TicketBookingSystem.Application.Exceptions.NotFoundException("Event", request.EventId);

        var totalCapacity = eventEntity.Seats.Count;
        var soldSeats = eventEntity.Seats.Where(s => s.Status == SeatStatus.Booked).ToList();
        var ticketsSold = soldSeats.Count;


        
        var totalNetRevenue = soldSeats.Sum(s => s.Price);


        var daysSinceCreation = Math.Max(1, (DateTime.UtcNow - eventEntity.EventDate.AddMonths(-1)).Days);
        var velocityNum = ticketsSold / daysSinceCreation;
        string velocity = $"{velocityNum} tkt / day";

        return new EventAnalyticsDto
        {
            EventId = eventEntity.Id,
            TotalNetRevenue = totalNetRevenue,
            TicketsSold = ticketsSold,
            RemainingTickets = totalCapacity - ticketsSold,
            TotalCapacity = totalCapacity,
            Velocity = velocity
        };
    }
}