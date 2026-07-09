using FluentValidation;
using System;
using TicketBookingSystem.Application.Features.PromoCodes.Commands;
using TicketBookingSystem.Application.Features.PromoCodes.Queries;

namespace TicketBookingSystem.Application.Features.PromoCodes.Validators;

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

