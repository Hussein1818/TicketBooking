using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Wallet;

public class GetWalletBalanceQuery : IRequest<decimal>
{
    public string Username { get; set; } = string.Empty;
}

public class GetWalletBalanceHandler : IRequestHandler<GetWalletBalanceQuery, decimal>
{
    private readonly IApplicationDbContext _context;

    public GetWalletBalanceHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> Handle(GetWalletBalanceQuery request, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.Username, ct);
        return user?.WalletBalance ?? 0;
    }
}

public class AddFundsCommand : IRequest<decimal>
{
    public string Username { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class AddFundsHandler : IRequestHandler<AddFundsCommand, decimal>
{
    private readonly IApplicationDbContext _context;

    public AddFundsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> Handle(AddFundsCommand request, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.Username, ct);

        if (user == null)
            throw new Exception("User not found");

        user.AddFunds(request.Amount);

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new Exception("Concurrency conflict occurred while adding funds.");
        }

        return user.WalletBalance;
    }
}

public class PayWithWalletCommand : IRequest<bool>
{
    public List<int> BookingIds { get; set; } = new();
    public string Username { get; set; } = string.Empty;
    public string? PromoCode { get; set; }
}

public class PayWithWalletHandler : IRequestHandler<PayWithWalletCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hub;
    private readonly IJobService _jobService;

    public PayWithWalletHandler(IApplicationDbContext context, ITicketHubService hub, IJobService jobService)
    {
        _context = context;
        _hub = hub;
        _jobService = jobService;
    }

    public async Task<bool> Handle(PayWithWalletCommand request, CancellationToken ct)
    {
        if (!request.BookingIds.Any())
            return false;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.Username, ct);

        var bookings = await _context.Bookings
            .Include(b => b.Seat)
            .Where(b => request.BookingIds.Contains(b.Id) && b.UserId == request.Username && b.Seat.Status == SeatStatus.Locked)
            .ToListAsync(ct);

        if (user == null || bookings.Count != request.BookingIds.Count)
            return false;

        decimal totalBasePrice = bookings.Sum(b => b.Seat.Price);
        decimal originalTotalEgp = totalBasePrice;

        if (user.Tier != SubscriptionTier.None && user.TierExpiryDate.HasValue && user.TierExpiryDate.Value > DateTime.UtcNow)
        {
            decimal discount = user.Tier switch
            {
                SubscriptionTier.Silver => 0.10m,
                SubscriptionTier.Gold => 0.20m,
                SubscriptionTier.VIP => 0.30m,
                _ => 0m
            };
            totalBasePrice -= totalBasePrice * discount;
        }

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var promo = await _context.PromoCodes.FirstOrDefaultAsync(p => p.Code == request.PromoCode && p.IsActive, ct);
            if (promo != null && promo.CurrentUsage < promo.MaxUsage)
            {
                totalBasePrice -= totalBasePrice * (promo.DiscountPercentage / 100);
                promo.CurrentUsage += 1;
            }
        }

        if (!user.DeductFunds(totalBasePrice))
            return false;

        // Give 1 loyalty point for every 10 EGP spent
        int pointsToAward = (int)(totalBasePrice / 10);
        user.AddLoyaltyPoints(pointsToAward);
        _context.AuditLogs.Add(new AuditLog { Username = request.Username, Action = "Loyalty Points",
            Details = $"Earned {pointsToAward} points from wallet purchase." });

        decimal feePercentage = 0.10m; // 10% platform fee

        foreach (var booking in bookings)
        {
            if (originalTotalEgp > 0)
            {
                booking.AmountPaid = Math.Round((booking.Seat.Price / originalTotalEgp) * totalBasePrice, 2);
            }

            // Revenue Split Logic
            booking.PlatformFee = Math.Round(booking.AmountPaid * feePercentage, 2);
            booking.OrganizerEarnings = booking.AmountPaid - booking.PlatformFee;

            booking.Seat.Status = SeatStatus.Booked;

            if (!string.IsNullOrEmpty(booking.JobId))
            {
                _jobService.CancelJob(booking.JobId);
            }
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Username = request.Username,
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