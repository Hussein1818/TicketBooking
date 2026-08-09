using FluentValidation;
using TicketBookingSystem.Application.Features.Admin.Commands;

namespace TicketBookingSystem.Application.Features.Admin.Validators;

public class RevokeAdminRoleCommandValidator : AbstractValidator<RevokeAdminRoleCommand>
{
    public RevokeAdminRoleCommandValidator()
    {
        RuleFor(v => v.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required.");
    }
}