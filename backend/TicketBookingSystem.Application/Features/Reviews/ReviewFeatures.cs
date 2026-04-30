using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Reviews;

public class AddReviewCommand : IRequest<bool>
{
    public int EventId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class AddReviewHandler : IRequestHandler<AddReviewCommand, bool>
{
    private readonly IApplicationDbContext _context;

    
    public AddReviewHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(AddReviewCommand request, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(request.UserId)) return false;

        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct);
        if (user == null) return false;

        
        var hasAttended = await _context.Bookings
            .AnyAsync(b => b.Seat.EventId == request.EventId
                        && b.UserId == request.UserId
                        && b.Seat.Status == SeatStatus.Booked
                        && b.Seat.Event.EventDate < DateTime.UtcNow, ct);

        if (!hasAttended) return false;

        
        var review = new Review
        {
            EventId = request.EventId,
            Username = user.UserName!, 
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);

        
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var reviewsThisMonth = await _context.Reviews
            .CountAsync(r => r.Username == user.UserName && r.CreatedAt >= startOfMonth, ct);

        if (reviewsThisMonth < 3)
        {
            user.AddLoyaltyPoints(50);
            _context.AuditLogs.Add(new AuditLog
            {
                Username = user.UserName!,
                Action = "Loyalty Points",
                Details = "Earned 50 points from reviewing."
            });
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }
}

public class GetEventReviewsQuery : IRequest<List<ReviewDto>> { public int EventId { get; set; } }

public class ReviewDto
{
    public string Username { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class GetEventReviewsHandler : IRequestHandler<GetEventReviewsQuery, List<ReviewDto>>
{
    private readonly IApplicationDbContext _context;
    public GetEventReviewsHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<ReviewDto>> Handle(GetEventReviewsQuery request, CancellationToken ct)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.EventId == request.EventId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto
            {
                Username = r.Username,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToListAsync(ct);
    }
}