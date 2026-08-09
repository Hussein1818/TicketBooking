using FluentValidation;
using TicketBookingSystem.Application.Features.Admin.Commands;

namespace TicketBookingSystem.Application.Features.Admin.Validators;

public class DeleteUserCommandValidator : AbstractValidator<DeleteUserCommand>
{
    public DeleteUserCommandValidator()
    {
        RuleFor(v => v.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required.");
    }
}