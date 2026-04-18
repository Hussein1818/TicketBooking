using FluentValidation;
using System.Linq;

namespace TicketBookingSystem.Application.Features.Orders.Commands;

/// <summary>
/// Validates CheckoutCartCommand before payment processing.
/// Protects against: empty carts, duplicate booking IDs, oversized carts (DoS),
/// invalid user identity, and unsupported currencies.
/// </summary>
public class CheckoutCartCommandValidator : AbstractValidator<CheckoutCartCommand>
{
    private static readonly string[] SupportedCurrencies = { "EGP", "USD", "EUR", "GBP", "SAR", "AED" };

    public CheckoutCartCommandValidator()
    {
        RuleFor(v => v.BookingIds)
            .NotEmpty().WithMessage("At least one booking ID is required.")
            .Must(ids => ids.Count <= 20).WithMessage("Cannot checkout more than 20 bookings at once.")
            .Must(ids => ids.All(id => id > 0)).WithMessage("All booking IDs must be greater than 0.")
            .Must(ids => ids.Distinct().Count() == ids.Count).WithMessage("Duplicate booking IDs are not allowed.");

        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.")
            .MaximumLength(50).WithMessage("User ID must not exceed 50 characters.");

        RuleFor(v => v.TargetCurrency)
            .Must(c => string.IsNullOrWhiteSpace(c) || SupportedCurrencies.Contains(c.ToUpper()))
            .WithMessage("Unsupported currency. Supported: EGP, USD, EUR, GBP, SAR, AED.");

        RuleFor(v => v.PromoCode)
            .MaximumLength(30).WithMessage("Promo code must not exceed 30 characters.")
            .When(v => !string.IsNullOrEmpty(v.PromoCode));
    }
}
