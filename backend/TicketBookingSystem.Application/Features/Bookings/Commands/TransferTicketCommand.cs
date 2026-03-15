using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class TransferTicketCommand : IRequest<bool>
{
    public int BookingId { get; set; }
    public string FromUsername { get; set; } = string.Empty;
    public string ToUsername { get; set; } = string.Empty;
}

public class TransferTicketCommandHandler : IRequestHandler<TransferTicketCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public TransferTicketCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(TransferTicketCommand request, CancellationToken cancellationToken)
    {
        var authUser = _currentUserService.Username;
        if (string.IsNullOrEmpty(authUser) || authUser.ToLower() == request.ToUsername.ToLower())
            return false;

        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.ToUsername, cancellationToken);
        if (targetUser == null || targetUser.Role == UserRole.Admin)
            return false;

        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == authUser, cancellationToken);

        if (booking == null || booking.Seat.Status != SeatStatus.Booked)
            return false;

        booking.UserId = request.ToUsername;
        _context.AuditLogs.Add(new AuditLog { Username = authUser, Action = "Ticket Transfer", Details = $"Transferred booking {request.BookingId} to {request.ToUsername}." });
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}