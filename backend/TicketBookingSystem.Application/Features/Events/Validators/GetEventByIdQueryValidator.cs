using FluentValidation;
using TicketBookingSystem.Application.Features.Events.Queries;

namespace TicketBookingSystem.Application.Features.Events.Validators;

public class GetEventByIdQueryValidator : AbstractValidator<GetEventByIdQuery>
{
    public GetEventByIdQueryValidator()
    {
        RuleFor(v => v.EventId).GreaterThan(0).WithMessage("Event ID is required.");
    }
}