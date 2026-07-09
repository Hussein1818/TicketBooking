using FluentValidation;
using TicketBookingSystem.Application.Features.Auth.Commands;

namespace TicketBookingSystem.Application.Features.Auth.Validators;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(v => v.CurrentPassword).NotEmpty().WithMessage("Current password is required.");
        RuleFor(v => v.NewPassword).NotEmpty().WithMessage("New password is required.").MinimumLength(6).WithMessage("New password must be at least 6 characters long.").NotEqual(v => v.CurrentPassword).WithMessage("New password must be different from the current password.");
    }
}