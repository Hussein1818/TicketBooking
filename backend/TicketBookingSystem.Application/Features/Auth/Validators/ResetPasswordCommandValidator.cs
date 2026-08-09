using FluentValidation;
using TicketBookingSystem.Application.Features.Auth.Commands;

namespace TicketBookingSystem.Application.Features.Auth.Validators;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(v => v.Email).NotEmpty().WithMessage("Email is required.").EmailAddress().WithMessage("A valid email address is required.");
        RuleFor(v => v.Token).NotEmpty().WithMessage("Token is required.");
        RuleFor(v => v.NewPassword).NotEmpty().WithMessage("New password is required.").MinimumLength(6).WithMessage("New password must be at least 6 characters long.");
    }
}