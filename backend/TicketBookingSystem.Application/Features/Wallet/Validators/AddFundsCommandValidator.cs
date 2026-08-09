using FluentValidation;
using TicketBookingSystem.Application.Features.Wallet.Commands;

namespace TicketBookingSystem.Application.Features.Wallet.Validators;

public class AddFundsCommandValidator : AbstractValidator<AddFundsCommand>
{
    public AddFundsCommandValidator()
    {
        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0.")
            .LessThanOrEqualTo(50000m).WithMessage("Cannot add more than 50,000 EGP in a single transaction.");
    }
}