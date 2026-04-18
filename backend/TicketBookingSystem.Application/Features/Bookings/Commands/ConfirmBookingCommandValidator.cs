using FluentValidation;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

/// <summary>
/// Validates ConfirmBookingCommand before payment URL generation.
/// Protects against: invalid seat IDs, empty user identity, unsupported currencies.
/// </summary>
public class ConfirmBookingCommandValidator : AbstractValidator<ConfirmBookingCommand>
{
    private static readonly string[] SupportedCurrencies = { "EGP", "USD", "EUR", "GBP", "SAR", "AED" };

    public ConfirmBookingCommandValidator()
    {
        RuleFor(v => v.SeatId)
            .GreaterThan(0).WithMessage("Seat ID must be greater than 0.");

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
