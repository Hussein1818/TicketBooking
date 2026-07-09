using FluentValidation;
using TicketBookingSystem.Application.Features.Events.Commands;

namespace TicketBookingSystem.Application.Features.Events.Validators;

public class DeleteEventCommandValidator : AbstractValidator<DeleteEventCommand>
{
    public DeleteEventCommandValidator()
    {
        RuleFor(v => v.EventId).GreaterThan(0).WithMessage("Event ID is required.");
    }
}