using FluentValidation;
using TicketBookingSystem.Application.Features.Auth.Commands;

namespace TicketBookingSystem.Application.Features.Auth.Validators;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(v => v.RefreshToken).NotEmpty().WithMessage("Refresh token is required.");
    }
}

public class RevokeTokenCommandValidator : AbstractValidator<RevokeTokenCommand>
{
    public RevokeTokenCommandValidator()
    {
        RuleFor(v => v.UserId).NotEmpty().WithMessage("User ID is required.");
    }
}