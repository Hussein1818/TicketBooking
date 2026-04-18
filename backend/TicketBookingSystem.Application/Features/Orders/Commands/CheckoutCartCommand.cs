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
    private readonly IPricingService _pricingService;

    public CheckoutCartCommandHandler(
        IApplicationDbContext context,
        IPaymentService paymentService,
        ICurrencyConverterService currencyConverter,
        IPricingService pricingService)
    {
        _context = context;
        _paymentService = paymentService;
        _currencyConverter = currencyConverter;
        _pricingService = pricingService;
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

        // Use centralized pricing service for discount calculation
        var pricing = await _pricingService.CalculateDiscountedPriceAsync(
            totalBasePriceEgp, user, request.PromoCode, cancellationToken);

        string currency = string.IsNullOrWhiteSpace(request.TargetCurrency) ? "EGP" : request.TargetCurrency.ToUpper();
        decimal toTargetRate = await _currencyConverter.GetExchangeRateAsync("EGP", currency);
        decimal toEgpRate = await _currencyConverter.GetExchangeRateAsync(currency, "EGP");

        decimal finalTotalInTargetCurrency = Math.Round(pricing.FinalPriceEgp * toTargetRate, 2);

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
            if (pricing.OriginalPriceEgp > 0)
            {
                booking.AmountPaid = Math.Round((booking.Seat.Price / pricing.OriginalPriceEgp) * finalTotalInTargetCurrency, 2);
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