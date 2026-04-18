using FluentValidation;

namespace TicketBookingSystem.Application.Features.Seats.Commands;

public class CreateSeatsCommandValidator : AbstractValidator<CreateSeatsCommand>
{
    public CreateSeatsCommandValidator()
    {
        RuleFor(v => v.EventId)
            .GreaterThan(0).WithMessage("Event ID must be greater than 0.");

        RuleFor(v => v.RegularSeatsCount)
            .GreaterThanOrEqualTo(0).WithMessage("Regular seats count cannot be negative.");

        RuleFor(v => v.VipSeatsCount)
            .GreaterThanOrEqualTo(0).WithMessage("VIP seats count cannot be negative.");

        RuleFor(v => v)
            .Must(v => v.RegularSeatsCount > 0 || v.VipSeatsCount > 0)
            .WithMessage("At least one seat (Regular or VIP) must be created.");

        RuleFor(v => v.PricePerSeat)
            .GreaterThanOrEqualTo(0).WithMessage("Price per seat cannot be negative.");
    }
}
