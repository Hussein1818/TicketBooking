using FluentValidation;
using System.Linq;

namespace TicketBookingSystem.Application.Features.Wallet;

/// <summary>
/// Validates AddFundsCommand.
/// Protects against: zero/negative amounts, absurdly large deposits (financial safety).
/// </summary>
public class AddFundsCommandValidator : AbstractValidator<AddFundsCommand>
{
    public AddFundsCommandValidator()
    {
        RuleFor(v => v.Username)
            .NotEmpty().WithMessage("Username is required.")
            .MaximumLength(50).WithMessage("Username must not exceed 50 characters.");

        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0.")
            .LessThanOrEqualTo(50000m).WithMessage("Cannot add more than 50,000 EGP in a single transaction.");
    }
}

/// <summary>
/// Validates PayWithWalletCommand.
/// Protects against: empty booking lists, duplicate IDs, oversized carts, missing identity.
/// </summary>
public class PayWithWalletCommandValidator : AbstractValidator<PayWithWalletCommand>
{
    public PayWithWalletCommandValidator()
    {
        RuleFor(v => v.BookingIds)
            .NotEmpty().WithMessage("At least one booking ID is required.")
            .Must(ids => ids.Count <= 20).WithMessage("Cannot pay for more than 20 bookings at once.")
            .Must(ids => ids.All(id => id > 0)).WithMessage("All booking IDs must be greater than 0.")
            .Must(ids => ids.Distinct().Count() == ids.Count).WithMessage("Duplicate booking IDs are not allowed.");

        RuleFor(v => v.Username)
            .NotEmpty().WithMessage("Username is required.")
            .MaximumLength(50).WithMessage("Username must not exceed 50 characters.");

        RuleFor(v => v.PromoCode)
            .MaximumLength(30).WithMessage("Promo code must not exceed 30 characters.")
            .When(v => !string.IsNullOrEmpty(v.PromoCode));
    }
}
