using FluentValidation;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class CompletePaymentCommandValidator : AbstractValidator<CompletePaymentCommand>
{
    public CompletePaymentCommandValidator()
    {
        RuleFor(v => v.OrderId)
            .GreaterThan(0).WithMessage("Order ID must be greater than 0.");
    }
}

public class TransferTicketCommandValidator : AbstractValidator<TransferTicketCommand>
{
    public TransferTicketCommandValidator()
    {
        RuleFor(v => v.BookingId)
            .GreaterThan(0).WithMessage("Booking ID must be greater than 0.");

        RuleFor(v => v.FromUsername)
            .NotEmpty().WithMessage("From Username is required.");

        RuleFor(v => v.ToUsername)
            .NotEmpty().WithMessage("To Username is required.")
            .NotEqual(v => v.FromUsername).WithMessage("Cannot transfer ticket to yourself.");
    }
}
