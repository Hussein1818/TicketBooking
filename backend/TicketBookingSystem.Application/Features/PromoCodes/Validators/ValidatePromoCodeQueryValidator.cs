using FluentValidation;
using System;
using TicketBookingSystem.Application.Features.PromoCodes.Commands;
using TicketBookingSystem.Application.Features.PromoCodes.Queries;

namespace TicketBookingSystem.Application.Features.PromoCodes.Validators;


public class ValidatePromoCodeQueryValidator : AbstractValidator<ValidatePromoCodeQuery>
{
    public ValidatePromoCodeQueryValidator()
    {
        RuleFor(v => v.Code)
            .NotEmpty().WithMessage("Promo code is required.");
    }
}