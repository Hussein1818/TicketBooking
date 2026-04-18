using FluentValidation;
using System;

namespace TicketBookingSystem.Application.Features.PromoCodes.Commands;

/// <summary>
/// Validates CreatePromoCodeCommand using FluentValidation.
/// Replaces the inline validation that was previously in the handler.
/// Protects against: empty codes, invalid discount ranges, past expiration dates.
/// </summary>
public class CreatePromoCodeCommandValidator : AbstractValidator<CreatePromoCodeCommand>
{
    public CreatePromoCodeCommandValidator()
    {
        RuleFor(v => v.Code)
            .NotEmpty().WithMessage("Promo code is required.")
            .MaximumLength(30).WithMessage("Promo code must not exceed 30 characters.")
            .Matches("^[A-Za-z0-9_-]+$").WithMessage("Promo code can only contain letters, numbers, hyphens, and underscores.");

        RuleFor(v => v.DiscountPercentage)
            .GreaterThan(0).WithMessage("Discount percentage must be greater than 0.")
            .LessThanOrEqualTo(100).WithMessage("Discount percentage must not exceed 100.");

        RuleFor(v => v.MaxUsage)
            .GreaterThan(0).WithMessage("Max usage must be greater than 0.")
            .LessThanOrEqualTo(100000).WithMessage("Max usage must not exceed 100,000.");

        RuleFor(v => v.ExpirationDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Expiration date must be in the future.");
    }
}
