using MediatR;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Events.Commands;


public class ManageEventCommand : IRequest<int>
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateTime EventDate { get; set; }
    public string Venue { get; set; }
    public bool IsClosed { get; set; }
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; }
}

public class ManageEventCommandHandler : IRequestHandler<ManageEventCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;

    public ManageEventCommandHandler(IApplicationDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<int> Handle(ManageEventCommand request, CancellationToken cancellationToken)
    {
        Event eventEntity;

        if (request.Id > 0)
        {
            
            eventEntity = await _context.Events.FindAsync(new object[] { request.Id }, cancellationToken);
            if (eventEntity == null) throw new Exception("Event not found");

            eventEntity.Name = request.Name;
            eventEntity.EventDate = request.EventDate;
            eventEntity.Venue = request.Venue;
            eventEntity.IsClosed = request.IsClosed;
            eventEntity.MaxTicketsPerUser = request.MaxTicketsPerUser;
            eventEntity.Category = request.Category;
        }
        else
        {
            
            eventEntity = new Event
            {
                Name = request.Name,
                EventDate = request.EventDate,
                Venue = request.Venue,
                IsClosed = request.IsClosed,
                MaxTicketsPerUser = request.MaxTicketsPerUser,
                Category = request.Category
            };
            _context.Events.Add(eventEntity);
        }

        await _context.SaveChangesAsync(cancellationToken);

        
        await _cache.RemoveAsync("Events_List", cancellationToken);

        if (request.Id > 0)
        {
            await _cache.RemoveAsync($"Seats_Event_{request.Id}", cancellationToken);
        }

        return eventEntity.Id;
    }
}