using FluentValidation;

namespace TicketBookingSystem.Application.Features.Auth.Queries;

public class LoginQueryValidator : AbstractValidator<LoginQuery>
{
    public LoginQueryValidator()
    {
        
        RuleFor(v => v.UsernameOrEmail)
            .NotEmpty().WithMessage("Username or Email is required.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}