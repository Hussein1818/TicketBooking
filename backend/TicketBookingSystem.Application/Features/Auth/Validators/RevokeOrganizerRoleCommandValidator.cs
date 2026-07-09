using FluentValidation;
using TicketBookingSystem.Application.Features.Auth.Commands;

namespace TicketBookingSystem.Application.Features.Auth.Validators;

public class RevokeOrganizerRoleCommandValidator : AbstractValidator<RevokeOrganizerRoleCommand>
{
    public RevokeOrganizerRoleCommandValidator()
    {
        RuleFor(v => v.UserId).NotEmpty().WithMessage("User ID is required to revoke a role.");
    }
}