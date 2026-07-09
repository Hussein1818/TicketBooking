using FluentValidation;
using System.Linq;
using TicketBookingSystem.Application.Features.Wallet.Commands;

namespace TicketBookingSystem.Application.Features.Wallet.Validators;

public class PayWithWalletCommandValidator : AbstractValidator<PayWithWalletCommand>
{
    public PayWithWalletCommandValidator()
    {
        RuleFor(v => v.BookingIds)
            .NotEmpty().WithMessage("At least one booking ID is required.")
            .Must(ids => ids.Count <= 20).WithMessage("Cannot pay for more than 20 bookings at once.")
            .Must(ids => ids.All(id => id > 0)).WithMessage("All booking IDs must be greater than 0.")
            .Must(ids => ids.Distinct().Count() == ids.Count).WithMessage("Duplicate booking IDs are not allowed.");

        RuleFor(v => v.PromoCode)
            .MaximumLength(30).WithMessage("Promo code must not exceed 30 characters.")
            .When(v => !string.IsNullOrEmpty(v.PromoCode));
    }
}