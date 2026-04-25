using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums; 

namespace TicketBookingSystem.Application.Features.Events.Queries.GetEventById;


public class EventDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public System.DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    
    public int FullRefundDays { get; set; }
    public int PartialRefundDays { get; set; }
    public decimal PartialRefundPercentage { get; set; }

    public string OrganizerId { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;

    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
}


public class GetEventByIdQuery : IRequest<EventDetailsDto>
{
    public int EventId { get; set; }
}


public class GetEventByIdQueryHandler : IRequestHandler<GetEventByIdQuery, EventDetailsDto>
{
    private readonly IApplicationDbContext _context;

    public GetEventByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EventDetailsDto> Handle(GetEventByIdQuery request, CancellationToken cancellationToken)
    {
        
        var eventDetails = await _context.Events
            .AsNoTracking()
            .Where(e => e.Id == request.EventId)
            .Select(e => new EventDetailsDto
            {
                Id = e.Id,
                Name = e.Name,
                EventDate = e.EventDate,
                Venue = e.Venue,
                IsClosed = e.IsClosed,
                MaxTicketsPerUser = e.MaxTicketsPerUser,
                Category = e.Category,
                ImageUrl = e.ImageUrl,
                FullRefundDays = e.FullRefundDays,
                PartialRefundDays = e.PartialRefundDays,
                PartialRefundPercentage = e.PartialRefundPercentage,
                OrganizerId = e.OrganizerId,
                OrganizerName = e.Organizer != null ? e.Organizer.FullName : "Unknown",



                TotalSeats = e.Seats.Count(),
                AvailableSeats = e.Seats.Count(s => s.Status == SeatStatus.Available)
            })
            .FirstOrDefaultAsync(cancellationToken);

        
        if (eventDetails == null)
            throw new NotFoundException("Event", request.EventId);

        return eventDetails;
    }
}