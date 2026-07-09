using FluentValidation;
using TicketBookingSystem.Application.Features.Bookings.Commands;
using TicketBookingSystem.Application.Features.Bookings.Queries;

namespace TicketBookingSystem.Application.Features.Bookings.Validators;

public class MockCheckoutCommandValidator : AbstractValidator<MockCheckoutCommand>
{
    public MockCheckoutCommandValidator()
    {
        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.");
    }
}

