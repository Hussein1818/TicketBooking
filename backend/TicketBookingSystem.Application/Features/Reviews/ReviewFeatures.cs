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
    public string Username { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class AddReviewHandler : IRequestHandler<AddReviewCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AddReviewHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(AddReviewCommand request, CancellationToken ct)
    {
        var authUser = _currentUserService.Username;
        if (string.IsNullOrEmpty(authUser)) return false;

        // PERF: No Include() needed — EF Core translates navigation properties
        // in the WHERE clause into SQL JOINs without materializing entities.
        var hasAttended = await _context.Bookings
            .AnyAsync(b => b.Seat.EventId == request.EventId
                        && b.UserId == authUser
                        && b.Seat.Status == SeatStatus.Booked
                        && b.Seat.Event.EventDate < DateTime.UtcNow, ct);

        if (!hasAttended) return false;

        var review = new Review
        {
            EventId = request.EventId,
            Username = authUser,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);

        
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var reviewsThisMonth = await _context.Reviews
            .CountAsync(r => r.Username == authUser && r.CreatedAt >= startOfMonth, ct);

        if (reviewsThisMonth < 3)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == authUser, ct);
            if (user != null)
            {
                user.AddLoyaltyPoints(50); 
                _context.AuditLogs.Add(new AuditLog { Username = authUser, Action = "Loyalty Points", Details = "Earned 50 points from reviewing." });
            }
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