using FluentValidation;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class BookSeatCommandValidator : AbstractValidator<BookSeatCommand>
{
    public BookSeatCommandValidator()
    {
        RuleFor(v => v.SeatId)
            .GreaterThan(0).WithMessage("Seat ID must be greater than 0.");

        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.")
            .MaximumLength(50).WithMessage("User ID must not exceed 50 characters.");
    }
}