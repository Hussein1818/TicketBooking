using FluentValidation;

namespace TicketBookingSystem.Application.Features.Wallet;

public class TransferFundsCommandValidator : AbstractValidator<TransferFundsCommand>
{
    public TransferFundsCommandValidator()
    {
        RuleFor(v => v.FromUsername)
            .NotEmpty().WithMessage("Sender username is required.");

        RuleFor(v => v.ToUsername)
            .NotEmpty().WithMessage("Receiver username is required.")
            .MaximumLength(50).WithMessage("Receiver username must not exceed 50 characters.");

        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Transfer amount must be greater than 0.")
            .LessThanOrEqualTo(10000m).WithMessage("Cannot transfer more than 10,000 EGP in a single transaction.");
    }
}