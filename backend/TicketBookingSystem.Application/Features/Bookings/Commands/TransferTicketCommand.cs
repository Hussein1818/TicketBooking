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
    public string FromUserId { get; set; } = string.Empty; 
    public string ToUsername { get; set; } = string.Empty; 
}

public class TransferTicketCommandHandler : IRequestHandler<TransferTicketCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public TransferTicketCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(TransferTicketCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.FromUserId))
            return false;

       
        var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.ToUsername, cancellationToken);

        
        if (targetUser == null || targetUser.Role == UserRole.Admin || targetUser.Id == request.FromUserId)
            return false;

        
        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == request.FromUserId, cancellationToken);

        if (booking == null || booking.Seat.Status != SeatStatus.Booked)
            return false;

        
        booking.UserId = targetUser.Id;

       
        var fromUser = await _context.Users.FindAsync(new object[] { request.FromUserId }, cancellationToken);
        string fromUsername = fromUser?.UserName ?? request.FromUserId;

        _context.AuditLogs.Add(new AuditLog { Username = fromUsername, Action = "Ticket Transfer", Details = $"Transferred booking {request.BookingId} to target user: {targetUser.UserName}." });

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}