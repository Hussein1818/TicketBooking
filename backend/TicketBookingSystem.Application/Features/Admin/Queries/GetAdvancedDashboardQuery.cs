using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Admin;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Admin.Queries;

public class GetAdvancedDashboardQuery : IRequest<AdvancedDashboardDto>
{
    public string CurrentUserId { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

public class GetAdvancedDashboardHandler : IRequestHandler<GetAdvancedDashboardQuery, AdvancedDashboardDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdvancedDashboardHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdvancedDashboardDto> Handle(GetAdvancedDashboardQuery request, CancellationToken ct)
    {
        var stats = new AdvancedDashboardDto();

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