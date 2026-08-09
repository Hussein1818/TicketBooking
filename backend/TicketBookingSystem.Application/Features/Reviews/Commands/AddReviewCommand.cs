using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Reviews.Commands;

public class AddReviewCommand : IRequest<bool>
{
    public int EventId { get; set; }

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class AddReviewCommandHandler : IRequestHandler<AddReviewCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AddReviewCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AddReviewCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(request.UserId)) return false;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null) return false;

        var hasAttended = await _context.Bookings
            .AnyAsync(b => b.Seat.EventId == request.EventId
                        && b.UserId == request.UserId
                        && b.IsUsed, cancellationToken);

        if (!hasAttended) return false;

        var eventClosed = await _context.Events
            .Where(e => e.Id == request.EventId)
            .Select(e => e.IsClosed)
            .FirstOrDefaultAsync(cancellationToken);

        if (!eventClosed) return false;

        var existingReview = await _context.Reviews
            .AnyAsync(r => r.EventId == request.EventId && r.UserId == request.UserId, cancellationToken);

        if (existingReview) return false;

        var review = new Review
        {
            EventId = request.EventId,
            UserId = request.UserId,
            Username = user.UserName ?? string.Empty,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);

        var thisMonth = DateTime.UtcNow.Month;
        var thisYear = DateTime.UtcNow.Year;

        var reviewsThisMonth = await _context.Reviews
            .CountAsync(r => r.UserId == request.UserId && r.CreatedAt.Month == thisMonth && r.CreatedAt.Year == thisYear, cancellationToken);

        if (reviewsThisMonth < 3)
        {
            user.AddLoyaltyPoints(50);
            _context.AuditLogs.Add(new AuditLog
            {
                Username = user.UserName ?? string.Empty,
                Action = "Loyalty Points",
                Details = "Earned 50 points from reviewing."
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}