using FluentValidation;
using TicketBookingSystem.Application.Features.Admin.Commands;

namespace TicketBookingSystem.Application.Features.Admin.Validators;

public class AssignAdminRoleCommandValidator : AbstractValidator<AssignAdminRoleCommand>
{
    public AssignAdminRoleCommandValidator()
    {
        RuleFor(v => v.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required.");
    }
}