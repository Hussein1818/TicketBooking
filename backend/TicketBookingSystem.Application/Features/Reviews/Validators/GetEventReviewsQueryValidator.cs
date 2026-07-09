using FluentValidation;
using TicketBookingSystem.Application.Features.Reviews.Commands;
using TicketBookingSystem.Application.Features.Reviews.Queries;

namespace TicketBookingSystem.Application.Features.Reviews.Validators;


public class GetEventReviewsQueryValidator : AbstractValidator<GetEventReviewsQuery>
{
    public GetEventReviewsQueryValidator()
    {
        RuleFor(v => v.EventId).GreaterThan(0).WithMessage("Event ID is required.");
    }
}