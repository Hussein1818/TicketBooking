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
    private readonly IPricingService _pricingService;

    public ConfirmBookingCommandHandler(
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

        // Use centralized pricing service for discount calculation
        var pricing = await _pricingService.CalculateDiscountedPriceAsync(
            seat.Price, user, request.PromoCode, cancellationToken);

        string currency = string.IsNullOrWhiteSpace(request.TargetCurrency) ? "EGP" : request.TargetCurrency.ToUpper();
        decimal toTargetRate = await _currencyConverter.GetExchangeRateAsync("EGP", currency);
        decimal toEgpRate = await _currencyConverter.GetExchangeRateAsync(currency, "EGP");

        decimal finalPriceInTargetCurrency = Math.Round(pricing.FinalPriceEgp * toTargetRate, 2);

        userBooking.AmountPaid = finalPriceInTargetCurrency;
        userBooking.Currency = currency;
        userBooking.ExchangeRate = toEgpRate;

        await _context.SaveChangesAsync(cancellationToken);

        var paymentUrl = await _paymentService.GetPaymentUrlAsync(userBooking.Id, finalPriceInTargetCurrency, currency);

        return paymentUrl;
    }
}