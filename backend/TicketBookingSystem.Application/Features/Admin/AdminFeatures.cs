using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Admin;

public class GetAdvancedDashboardQuery : IRequest<AdvancedDashboardDto> { }

public class AdvancedDashboardDto
{
    public int TotalEvents { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBookedSeats { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<TopEventDto> TopEvents { get; set; } = new();
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
}

public class TopEventDto { public string Name { get; set; } = string.Empty; public decimal Revenue { get; set; } }
public class TopCustomerDto { public string Username { get; set; } = string.Empty; public int TicketsBought { get; set; } }

public class GetAdvancedDashboardHandler : IRequestHandler<GetAdvancedDashboardQuery, AdvancedDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdvancedDashboardHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdvancedDashboardDto> Handle(GetAdvancedDashboardQuery request, CancellationToken ct)
    {
        var stats = new AdvancedDashboardDto();

        stats.TotalEvents = await _context.Events.CountAsync(ct);
        stats.TotalUsers = await _context.Users.CountAsync(ct);
        stats.TotalBookedSeats = await _context.Bookings.CountAsync(ct);

        stats.TotalRevenue = await _context.Bookings.SumAsync(b => (decimal?)(b.AmountPaid * b.ExchangeRate), ct) ?? 0;

        var topEvents = await _context.Events
            .Select(e => new TopEventDto
            {
                Name = e.Name,
                Revenue = _context.Bookings.Where(b => b.Seat.EventId == e.Id).Sum(b => (decimal?)(b.AmountPaid * b.ExchangeRate)) ?? 0
            })
            .OrderByDescending(e => e.Revenue)
            .Take(5)
            .ToListAsync(ct);

        stats.TopEvents = topEvents;

        var topCustomers = await _context.Bookings
            .GroupBy(b => b.User.UserName)
            .Select(g => new TopCustomerDto
            {
                Username = g.Key ?? "Unknown",
                TicketsBought = g.Count()
            })
            .OrderByDescending(c => c.TicketsBought)
            .Take(5)
            .ToListAsync(ct);

        stats.TopCustomers = topCustomers;

        return stats;
    }
}

public class GetSystemLogsQuery : IRequest<List<AuditLogDto>> { }

public class AuditLogDto
{
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class GetSystemLogsHandler : IRequestHandler<GetSystemLogsQuery, List<AuditLogDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSystemLogsHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<AuditLogDto>> Handle(GetSystemLogsQuery request, CancellationToken ct)
    {
        return await _context.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .Take(50)
            .Select(a => new AuditLogDto
            {
                Username = a.Username,
                Action = a.Action,
                Details = a.Details,
                Timestamp = a.Timestamp
            })
            .ToListAsync(ct);
    }
}