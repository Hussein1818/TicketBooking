using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Waitlists.Commands;

public class JoinWaitlistCommand : IRequest<bool>
{
    public int EventId { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class JoinWaitlistCommandHandler : IRequestHandler<JoinWaitlistCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public JoinWaitlistCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(JoinWaitlistCommand request, CancellationToken cancellationToken)
    {
        var exists = await _context.Waitlists
            .AnyAsync(w => w.EventId == request.EventId && w.UserId == request.UserId, cancellationToken);

        if (exists) return false;

        var userEmail = await _context.Users
            .Where(u => u.UserName == request.UserId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrEmpty(userEmail)) return false;

        _context.Waitlists.Add(new Waitlist
        {
            EventId = request.EventId,
            UserId = request.UserId,
            Email = userEmail
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}