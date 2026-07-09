using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Events;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Events.Queries;

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
                AttendingCount = e.Seats.Count(s => s.Status == SeatStatus.Booked),
                TotalSeats = e.Seats.Count(),
                AvailableSeats = e.Seats.Count(s => s.Status == SeatStatus.Available)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (eventDetails == null)
            throw new NotFoundException(nameof(Domain.Entities.Event), request.EventId);

        return eventDetails;
    }
}