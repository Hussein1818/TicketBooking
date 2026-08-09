using FluentValidation;
using TicketBookingSystem.Application.Features.Bookings.Commands;
using TicketBookingSystem.Application.Features.Bookings.Queries;

namespace TicketBookingSystem.Application.Features.Bookings.Validators;


public class ValidateTicketQueryValidator : AbstractValidator<ValidateTicketQuery>
{
    public ValidateTicketQueryValidator()
    {
        RuleFor(v => v.QrData)
            .NotEmpty().WithMessage("QR Data is required for validation.")
            .Must(data => data.StartsWith("TICKET|")).WithMessage("Invalid QR Code format.");
    }
}