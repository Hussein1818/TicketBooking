using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums; 
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Admin;

public class GetAdvancedDashboardQuery : IRequest<AdvancedDashboardDto>
{
    public string CurrentUserId { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

public class AdvancedDashboardDto
{
    public int TotalEvents { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBookedSeats { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<TopEventDto> TopEvents { get; set; } = new();
    public List<TopCustomerDto> TopCustomers { get; set; } = new();

    
    public List<ActiveCampaignDto> ActiveCampaigns { get; set; } = new();
}

public class TopEventDto { public string Name { get; set; } = string.Empty; public decimal Revenue { get; set; } }
public class TopCustomerDto { public string Username { get; set; } = string.Empty; public int TicketsBought { get; set; } }


public class ActiveCampaignDto
{
    public int EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Velocity { get; set; }
    public decimal GrossRevenue { get; set; }
}

public class GetAdvancedDashboardHandler : IRequestHandler<GetAdvancedDashboardQuery, AdvancedDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdvancedDashboardHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdvancedDashboardDto> Handle(GetAdvancedDashboardQuery request, CancellationToken ct)
    {
        var stats = new AdvancedDashboardDto();

        // PERF: No Include() needed — EF Core translates navigation access in
        // Where/Sum/GroupBy into SQL JOINs without loading entities into memory.
        var eventsQuery = _context.Events.AsNoTracking().AsQueryable();
        var bookingsQuery = _context.Bookings.AsNoTracking().AsQueryable();

        if (!request.IsAdmin)
        {
            eventsQuery = eventsQuery.Where(e => e.OrganizerId == request.CurrentUserId);
            bookingsQuery = bookingsQuery.Where(b => b.Seat.Event.OrganizerId == request.CurrentUserId);
        }

        stats.TotalEvents = await eventsQuery.CountAsync(ct);
        stats.TotalBookedSeats = await bookingsQuery.CountAsync(ct);

        if (request.IsAdmin)
        {
            stats.TotalUsers = await _context.Users.AsNoTracking().CountAsync(ct);
        }
        else
        {
            stats.TotalUsers = await bookingsQuery.Select(b => b.UserId).Distinct().CountAsync(ct);
        }

        stats.TotalRevenue = request.IsAdmin
            ? await bookingsQuery.SumAsync(b => (decimal?)(b.PlatformFee * b.ExchangeRate), ct) ?? 0
            : await bookingsQuery.SumAsync(b => (decimal?)(b.OrganizerEarnings * b.ExchangeRate), ct) ?? 0;

        stats.TopEvents = await eventsQuery
            .Select(e => new TopEventDto
            {
                Name = e.Name,
                Revenue = request.IsAdmin
                    ? _context.Bookings.Where(b => b.Seat.EventId == e.Id).Sum(b => (decimal?)(b.PlatformFee * b.ExchangeRate)) ?? 0
                    : _context.Bookings.Where(b => b.Seat.EventId == e.Id).Sum(b => (decimal?)(b.OrganizerEarnings * b.ExchangeRate)) ?? 0
            })
            .OrderByDescending(e => e.Revenue)
            .Take(5)
            .ToListAsync(ct);

        stats.TopCustomers = await bookingsQuery
            .GroupBy(b => b.User.UserName)
            .Select(g => new TopCustomerDto
            {
                Username = g.Key ?? "Unknown",
                TicketsBought = g.Count()
            })
            .OrderByDescending(c => c.TicketsBought)
            .Take(5)
            .ToListAsync(ct);

        
        var oneHourAgo = DateTime.UtcNow.AddHours(-1);

        stats.ActiveCampaigns = await eventsQuery
            .Select(e => new ActiveCampaignDto
            {
                EventId = e.Id,
                Name = e.Name,
                Status = e.IsClosed ? "CLOSED" :
                         (!_context.Seats.Any(s => s.EventId == e.Id && s.Status == SeatStatus.Available) ? "WAITLIST" : "ON SALE"),
                Velocity = _context.Bookings.Count(b => b.Seat.EventId == e.Id && b.BookingDate >= oneHourAgo && b.Seat.Status == SeatStatus.Booked),
                GrossRevenue = request.IsAdmin
                    ? _context.Bookings.Where(b => b.Seat.EventId == e.Id).Sum(b => (decimal?)(b.PlatformFee * b.ExchangeRate)) ?? 0
                    : _context.Bookings.Where(b => b.Seat.EventId == e.Id).Sum(b => (decimal?)(b.OrganizerEarnings * b.ExchangeRate)) ?? 0
            })
            .OrderByDescending(c => c.Velocity)
            .Take(10)
            .ToListAsync(ct);

        return stats;
    }
}

public class GetSystemLogsQuery : IRequest<PagedResult<AuditLogDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class AuditLogDto
{
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class GetSystemLogsHandler : IRequestHandler<GetSystemLogsQuery, PagedResult<AuditLogDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSystemLogsHandler(IApplicationDbContext context) => _context = context;

    public async Task<PagedResult<AuditLogDto>> Handle(GetSystemLogsQuery request, CancellationToken ct)
    {
        // Clamp page/pageSize to safe ranges
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _context.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.Timestamp);

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Username = a.Username,
                Action = a.Action,
                Details = a.Details,
                Timestamp = a.Timestamp
            })
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}