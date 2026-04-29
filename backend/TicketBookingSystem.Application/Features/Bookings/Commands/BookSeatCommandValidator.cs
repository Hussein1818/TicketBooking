using FluentValidation;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class BookSeatCommandValidator : AbstractValidator<BookSeatCommand>
{
    public BookSeatCommandValidator()
    {
        RuleFor(v => v.SeatId)
            .GreaterThan(0).WithMessage("Seat ID must be greater than 0.");

        
    }
}