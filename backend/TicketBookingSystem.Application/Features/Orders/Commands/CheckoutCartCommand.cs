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

namespace TicketBookingSystem.Application.Features.Orders.Commands;

public class CheckoutCartCommand : IRequest<string>
{
    public List<int> BookingIds { get; set; } = new();
    public string UserId { get; set; } = string.Empty;
    public string? PromoCode { get; set; }
    public string TargetCurrency { get; set; } = "EGP";
}

public class CheckoutCartCommandHandler : IRequestHandler<CheckoutCartCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentService _paymentService;
    private readonly ICurrencyConverterService _currencyConverter;

    public CheckoutCartCommandHandler(
        IApplicationDbContext context,
        IPaymentService paymentService,
        ICurrencyConverterService currencyConverter)
    {
        _context = context;
        _paymentService = paymentService;
        _currencyConverter = currencyConverter;
    }

    public async Task<string> Handle(CheckoutCartCommand request, CancellationToken cancellationToken)
    {
        if (!request.BookingIds.Any()) return string.Empty;

        var bookings = await _context.Bookings
            .Include(b => b.Seat)
            .Where(b => request.BookingIds.Contains(b.Id) && b.UserId == request.UserId)
            .ToListAsync(cancellationToken);

        if (bookings.Count != request.BookingIds.Count) return string.Empty;

        if (bookings.Any(b => b.Seat.Status != SeatStatus.Locked)) return string.Empty;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserId, cancellationToken);
        if (user == null) return string.Empty;

        decimal totalBasePriceEgp = bookings.Sum(b => b.Seat.Price);
        decimal originalTotalEgp = totalBasePriceEgp;

        if (user.Tier != SubscriptionTier.None && user.TierExpiryDate.HasValue && user.TierExpiryDate.Value > DateTime.UtcNow)
        {
            decimal discount = user.Tier switch
            {
                SubscriptionTier.Silver => 0.10m,
                SubscriptionTier.Gold => 0.20m,
                SubscriptionTier.VIP => 0.30m,
                _ => 0m
            };
            totalBasePriceEgp -= totalBasePriceEgp * discount;
        }

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var promo = await _context.PromoCodes.FirstOrDefaultAsync(p => p.Code == request.PromoCode && p.IsActive, cancellationToken);
            if (promo != null && promo.CurrentUsage < promo.MaxUsage)
            {
                totalBasePriceEgp -= totalBasePriceEgp * (promo.DiscountPercentage / 100);
                promo.CurrentUsage += 1;
            }
        }

        string currency = string.IsNullOrWhiteSpace(request.TargetCurrency) ? "EGP" : request.TargetCurrency.ToUpper();
        decimal toTargetRate = await _currencyConverter.GetExchangeRateAsync("EGP", currency);
        decimal toEgpRate = await _currencyConverter.GetExchangeRateAsync(currency, "EGP");

        decimal finalTotalInTargetCurrency = Math.Round(totalBasePriceEgp * toTargetRate, 2);

        var order = new Order
        {
            UserId = request.UserId,
            OrderDate = DateTime.UtcNow,
            TotalAmount = finalTotalInTargetCurrency,
            Currency = currency,
            Status = "Pending"
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        foreach (var booking in bookings)
        {
            if (originalTotalEgp > 0)
            {
                booking.AmountPaid = Math.Round((booking.Seat.Price / originalTotalEgp) * finalTotalInTargetCurrency, 2);
            }
            booking.Currency = currency;
            booking.ExchangeRate = toEgpRate;
            booking.OrderId = order.Id;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var paymentUrl = await _paymentService.GetPaymentUrlAsync(order.Id, finalTotalInTargetCurrency, currency);

        return paymentUrl;
    }
}