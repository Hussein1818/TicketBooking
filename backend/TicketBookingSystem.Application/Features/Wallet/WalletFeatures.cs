using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
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
            throw new NotFoundException(nameof(Domain.Entities.User), request.Username);

        user.AddFunds(request.Amount);

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("Concurrency conflict occurred while adding funds. Please try again.");
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
    private readonly IPricingService _pricingService;

    public PayWithWalletHandler(IApplicationDbContext context, ITicketHubService hub, IJobService jobService, IPricingService pricingService)
    {
        _context = context;
        _hub = hub;
        _jobService = jobService;
        _pricingService = pricingService;
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

        // Use centralized pricing service for discount calculation
        var pricing = await _pricingService.CalculateDiscountedPriceAsync(
            totalBasePrice, user, request.PromoCode, ct);

        if (!user.DeductFunds(pricing.FinalPriceEgp))
            return false;

        // Give 1 loyalty point for every 10 EGP spent
        int pointsToAward = (int)(pricing.FinalPriceEgp / 10);
        user.AddLoyaltyPoints(pointsToAward);
        _context.AuditLogs.Add(new AuditLog { Username = request.Username, Action = "Loyalty Points",
            Details = $"Earned {pointsToAward} points from wallet purchase." });

        foreach (var booking in bookings)
        {
            if (pricing.OriginalPriceEgp > 0)
            {
                booking.AmountPaid = Math.Round((booking.Seat.Price / pricing.OriginalPriceEgp) * pricing.FinalPriceEgp, 2);
            }

            // Use centralized revenue split
            _pricingService.ApplyRevenueSplit(booking);

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