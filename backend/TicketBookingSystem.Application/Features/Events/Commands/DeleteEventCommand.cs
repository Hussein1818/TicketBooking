using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Events.Commands;

public class DeleteEventCommand : IRequest<bool>
{
    public int EventId { get; set; }

    [JsonIgnore]
    public string CurrentUserId { get; set; } = string.Empty;

    [JsonIgnore]
    public bool IsAdmin { get; set; }
}

public class DeleteEventCommandHandler : IRequestHandler<DeleteEventCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteEventCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var eventEntity = await _context.Events
            .Include(e => e.Seats)
            .FirstOrDefaultAsync(e => e.Id == request.EventId, cancellationToken);

        if (eventEntity == null)
            throw new NotFoundException(nameof(Domain.Entities.Event), request.EventId);

        if (!request.IsAdmin && eventEntity.OrganizerId != request.CurrentUserId)
            throw new BadRequestException("You do not have permission to delete this event.");

        bool hasBookings = eventEntity.Seats.Any(s => s.Status == SeatStatus.Booked);
        if (hasBookings)
            throw new BadRequestException("Cannot delete an event that already has booked tickets. Cancel the event instead.");

        _context.Events.Remove(eventEntity);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}