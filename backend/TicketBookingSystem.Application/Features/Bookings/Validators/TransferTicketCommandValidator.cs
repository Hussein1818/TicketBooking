using FluentValidation;
using TicketBookingSystem.Application.Features.Bookings.Commands;

namespace TicketBookingSystem.Application.Features.Bookings.Validators;



public class TransferTicketCommandValidator : AbstractValidator<TransferTicketCommand>
{
    public TransferTicketCommandValidator()
    {
        RuleFor(v => v.BookingId)
            .GreaterThan(0).WithMessage("Booking ID must be greater than 0.");
        RuleFor(v => v.ToUsername)
            .NotEmpty().WithMessage("To Username is required.");
    }
}