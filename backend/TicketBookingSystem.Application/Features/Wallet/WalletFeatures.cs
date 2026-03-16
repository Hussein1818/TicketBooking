using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
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
        if (user == null) throw new Exception("User not found");

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
    public int SeatId { get; set; }
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
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.Username, ct);

        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .FirstOrDefaultAsync(b => b.SeatId == request.SeatId && b.UserId == request.Username && b.Seat.Status == SeatStatus.Locked, ct);

        if (user == null || booking == null) return false;

        decimal finalPrice = booking.Seat.Price;
        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var promo = await _context.PromoCodes.FirstOrDefaultAsync(p => p.Code == request.PromoCode && p.IsActive, ct);
            if (promo != null && promo.CurrentUsage < promo.MaxUsage)
            {
                finalPrice -= finalPrice * (promo.DiscountPercentage / 100);
                promo.CurrentUsage += 1;
            }
        }

        if (!user.DeductFunds(finalPrice)) return false;

        booking.AmountPaid = finalPrice;
        booking.Seat.Status = SeatStatus.Booked;
        _context.AuditLogs.Add(new AuditLog { Username = request.Username, Action = "Ticket Purchase", Details = $"Bought seat {request.SeatId} with wallet." });

        if (!string.IsNullOrEmpty(booking.JobId))
        {
            _jobService.CancelJob(booking.JobId);
        }

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }

        await _hub.SendSeatBookedNotification(request.SeatId);
        await _hub.SendDashboardUpdate();

        return true;
    }
}