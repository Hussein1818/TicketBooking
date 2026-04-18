using FluentValidation;

namespace TicketBookingSystem.Application.Features.Waitlists.Commands;

public class JoinWaitlistCommandValidator : AbstractValidator<JoinWaitlistCommand>
{
    public JoinWaitlistCommandValidator()
    {
        RuleFor(v => v.EventId)
            .GreaterThan(0).WithMessage("Event ID must be greater than 0.");

        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.");
    }
}
