using FluentValidation;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class ScanTicketCommandValidator : AbstractValidator<ScanTicketCommand>
{
    public ScanTicketCommandValidator()
    {
        RuleFor(v => v.QrData)
            .NotEmpty().WithMessage("QR Data is required for scanning.");

        RuleFor(v => v.ScannedByUsername)
            .NotEmpty().WithMessage("Scanning user identity must be provided.");
    }
}
