using FluentValidation;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

/// <summary>
/// Validates CancelBookingCommand.
/// Protects against: invalid booking IDs, empty user identity.
/// </summary>
public class CancelBookingCommandValidator : AbstractValidator<CancelBookingCommand>
{
    public CancelBookingCommandValidator()
    {
        RuleFor(v => v.BookingId)
            .GreaterThan(0).WithMessage("Booking ID must be greater than 0.");

        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.")
            .MaximumLength(50).WithMessage("User ID must not exceed 50 characters.");
    }
}
