using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Wallet.Commands;

public class PayWithWalletCommand : IRequest<bool>
{
    public List<int> BookingIds { get; set; } = new();

    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public string? PromoCode { get; set; }
}

public class PayWithWalletCommandHandler : IRequestHandler<PayWithWalletCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IPricingService _pricingService;
    private readonly IJobService _jobService;
    private readonly ITicketHubService _hub;

    public PayWithWalletCommandHandler(
        IApplicationDbContext context,
        IPricingService pricingService,
        IJobService jobService,
        ITicketHubService hub)
    {
        _context = context;
        _pricingService = pricingService;
        _jobService = jobService;
        _hub = hub;
    }

    public async Task<bool> Handle(PayWithWalletCommand request, CancellationToken ct)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Seat)
            .Where(b => request.BookingIds.Contains(b.Id) && b.UserId == request.UserId && b.Seat.Status == SeatStatus.Locked)
            .ToListAsync(ct);

        if (!bookings.Any()) return false;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct);
        if (user == null) return false;

        decimal totalBasePriceEgp = bookings.Sum(b => b.Seat.Price);
        var pricing = await _pricingService.CalculateDiscountedPriceAsync(totalBasePriceEgp, user, request.PromoCode, ct);

        if (!user.DeductFunds(pricing.FinalPriceEgp))
            return false;

        var order = new Order
        {
            UserId = request.UserId,
            OrderDate = DateTime.UtcNow,
            TotalAmount = pricing.FinalPriceEgp,
            Currency = AppConstants.DefaultCurrency,
            Status = "Paid"
        };
        _context.Orders.Add(order);

        int pointsToAward = (int)(pricing.FinalPriceEgp / 10);
        user.AddLoyaltyPoints(pointsToAward);

        _context.AuditLogs.Add(new AuditLog
        {
            Username = user.UserName ?? string.Empty,
            Action = "Loyalty Points",
            Details = $"Earned {pointsToAward} points from wallet purchase."
        });

        foreach (var booking in bookings)
        {
            if (pricing.OriginalPriceEgp > 0)
            {
                booking.AmountPaid = Math.Round((booking.Seat.Price / pricing.OriginalPriceEgp) * pricing.FinalPriceEgp, 2);
            }

            booking.Currency = AppConstants.DefaultCurrency;
            booking.ExchangeRate = 1m;
            _pricingService.ApplyRevenueSplit(booking);

            booking.Seat.Status = SeatStatus.Booked;

            if (!string.IsNullOrEmpty(booking.JobId))
            {
                _jobService.CancelJob(booking.JobId);
            }
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Username = user.UserName ?? string.Empty,
            Action = "Cart Purchase",
            Details = $"Bought {bookings.Count} seats with wallet."
        });

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }

        foreach (var booking in bookings)
        {
            await _hub.SendSeatBookedNotification(booking.SeatId);
        }
        await _hub.SendDashboardUpdate();

        return true;
    }
}