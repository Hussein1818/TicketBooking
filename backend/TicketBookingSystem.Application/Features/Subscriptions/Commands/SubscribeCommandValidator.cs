using FluentValidation;

namespace TicketBookingSystem.Application.Features.Subscriptions.Commands;

public class SubscribeCommandValidator : AbstractValidator<SubscribeCommand>
{
    public SubscribeCommandValidator()
    {
        RuleFor(v => v.Username)
            .NotEmpty().WithMessage("Username is required.");

        RuleFor(v => v.Tier)
            .IsInEnum().WithMessage("Invalid subscription tier.")
            .NotEqual(Domain.Enums.SubscriptionTier.None).WithMessage("Must select a valid subscription tier.");

        RuleFor(v => v.Months)
            .GreaterThan(0).WithMessage("Months must be greater than 0.")
            .LessThanOrEqualTo(12).WithMessage("Cannot subscribe for more than 12 months at a time.");
    }
}
