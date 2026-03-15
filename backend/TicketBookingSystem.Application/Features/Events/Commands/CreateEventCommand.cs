using MediatR;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Events.Commands;

public class CreateEventCommand : IRequest<int>
{
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; } = "General";
}

public class CreateEventCommandHandler : IRequestHandler<CreateEventCommand, int>
{
    private readonly IApplicationDbContext _context;

    public CreateEventCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> Handle(CreateEventCommand request, CancellationToken cancellationToken)
    {
        var newEvent = new Event
        {
            Name = request.Name,
            EventDate = request.EventDate,
            Venue = request.Venue,
            MaxTicketsPerUser = request.MaxTicketsPerUser > 0 ? request.MaxTicketsPerUser : 1,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category
        };

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync(cancellationToken);

        return newEvent.Id;
    }
}