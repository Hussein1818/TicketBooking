using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Reviews;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Reviews.Queries;

public class GetEventReviewsQuery : IRequest<List<ReviewDto>>
{
    public int EventId { get; set; }
}

public class GetEventReviewsQueryHandler : IRequestHandler<GetEventReviewsQuery, List<ReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public GetEventReviewsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ReviewDto>> Handle(GetEventReviewsQuery request, CancellationToken cancellationToken)
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
            })
            .ToListAsync(cancellationToken);
    }
}