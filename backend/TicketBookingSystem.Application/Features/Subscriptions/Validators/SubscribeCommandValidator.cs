using FluentValidation;
using TicketBookingSystem.Application.Features.Subscriptions.Commands;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Subscriptions.Validators;

public class SubscribeCommandValidator : AbstractValidator<SubscribeCommand>
{
    public SubscribeCommandValidator()
    {
        RuleFor(v => v.Months)
            .GreaterThan(0).WithMessage("Subscription duration must be at least 1 month.")
            .LessThanOrEqualTo(12).WithMessage("Maximum subscription duration is 12 months at a time.");

        RuleFor(v => v.Tier)
            .IsInEnum().WithMessage("Invalid subscription tier selected.")
            .NotEqual(SubscriptionTier.None).WithMessage("You must select a valid subscription tier.");

        RuleFor(v => v.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .MaximumLength(50).WithMessage("Payment method name is too long.");
    }
}