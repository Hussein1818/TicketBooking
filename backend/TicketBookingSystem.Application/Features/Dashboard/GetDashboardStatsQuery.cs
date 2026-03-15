using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Dashboard;

public class DashboardStatsDto
{
    public int TotalEvents { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBookedSeats { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class GetDashboardStatsQuery : IRequest<DashboardStatsDto>
{
}

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IApplicationDbContext _context;

    public GetDashboardStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var totalEvents = await _context.Events.CountAsync(cancellationToken);

        var totalUsers = await _context.Users.CountAsync(cancellationToken);

        var totalBookedSeats = await _context.Seats
            .CountAsync(s => s.Status == SeatStatus.Booked, cancellationToken);

        var totalRevenue = await _context.Bookings
            .SumAsync(b => b.AmountPaid, cancellationToken);

        return new DashboardStatsDto
        {
            TotalEvents = totalEvents,
            TotalUsers = totalUsers,
            TotalBookedSeats = totalBookedSeats,
            TotalRevenue = totalRevenue
        };
    }
}