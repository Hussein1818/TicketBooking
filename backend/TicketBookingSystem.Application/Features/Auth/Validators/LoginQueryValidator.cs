using TicketBookingSystem.Application.Features.Auth.Queries;
using FluentValidation;

namespace TicketBookingSystem.Application.Features.Auth.Validators;

public class LoginQueryValidator : AbstractValidator<LoginQuery>
{
    public LoginQueryValidator()
    {
       
        RuleFor(v => v.UsernameOrEmail)
            .NotEmpty().WithMessage("Username or Email is required.")
            .MaximumLength(150).WithMessage("Input exceeds maximum allowed length.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MaximumLength(100).WithMessage("Password exceeds maximum allowed length.");
    }
}