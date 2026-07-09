using FluentValidation;
using TicketBookingSystem.Application.Features.Waitlists.Commands;

namespace TicketBookingSystem.Application.Features.Waitlists.Validators;

public class JoinWaitlistCommandValidator : AbstractValidator<JoinWaitlistCommand>
{
    public JoinWaitlistCommandValidator()
    {
        RuleFor(v => v.EventId)
            .GreaterThan(0).WithMessage("Event ID must be greater than 0.");
    }
}