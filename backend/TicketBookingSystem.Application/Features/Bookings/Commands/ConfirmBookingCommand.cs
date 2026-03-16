using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class ConfirmBookingCommand : IRequest<string>
{
    public int SeatId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? PromoCode { get; set; }
    public string TargetCurrency { get; set; } = "EGP";
}

public class ConfirmBookingCommandHandler : IRequestHandler<ConfirmBookingCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentService _paymentService;
    private readonly ICurrencyConverterService _currencyConverter;

    public ConfirmBookingCommandHandler(
        IApplicationDbContext context,
        IPaymentService paymentService,
        ICurrencyConverterService currencyConverter)
    {
        _context = context;
        _paymentService = paymentService;
        _currencyConverter = currencyConverter;
    }

    public async Task<string> Handle(ConfirmBookingCommand request, CancellationToken cancellationToken)
    {
        var seat = await _context.Seats.FindAsync(new object[] { request.SeatId }, cancellationToken);

        if (seat == null || seat.Status != SeatStatus.Locked)
            return string.Empty;

        var userBooking = await _context.Bookings
            .Where(b => b.SeatId == request.SeatId && b.UserId == request.UserId)
            .OrderByDescending(b => b.BookingDate)
            .FirstOrDefaultAsync(cancellationToken);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserName == request.UserId, cancellationToken);

        if (userBooking == null || user == null)
            return string.Empty;

        decimal basePriceEgp = seat.Price;

        if (user.Tier != SubscriptionTier.None && user.TierExpiryDate.HasValue && user.TierExpiryDate.Value > DateTime.UtcNow)
        {
            decimal discount = user.Tier switch
            {
                SubscriptionTier.Silver => 0.10m,
                SubscriptionTier.Gold => 0.20m,
                SubscriptionTier.VIP => 0.30m,
                _ => 0m
            };
            basePriceEgp -= basePriceEgp * discount;
        }

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var promo = await _context.PromoCodes
                .FirstOrDefaultAsync(p => p.Code == request.PromoCode && p.IsActive, cancellationToken);

            if (promo != null && promo.CurrentUsage < promo.MaxUsage)
            {
                decimal discountAmount = basePriceEgp * (promo.DiscountPercentage / 100);
                basePriceEgp -= discountAmount;
                promo.CurrentUsage += 1;
            }
        }

        string currency = string.IsNullOrWhiteSpace(request.TargetCurrency) ? "EGP" : request.TargetCurrency.ToUpper();
        decimal toTargetRate = await _currencyConverter.GetExchangeRateAsync("EGP", currency);
        decimal toEgpRate = await _currencyConverter.GetExchangeRateAsync(currency, "EGP");

        decimal finalPriceInTargetCurrency = Math.Round(basePriceEgp * toTargetRate, 2);

        userBooking.AmountPaid = finalPriceInTargetCurrency;
        userBooking.Currency = currency;
        userBooking.ExchangeRate = toEgpRate;

        await _context.SaveChangesAsync(cancellationToken);

        var paymentUrl = await _paymentService.GetPaymentUrlAsync(userBooking.Id, finalPriceInTargetCurrency, currency);

        return paymentUrl;
    }
}