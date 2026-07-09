using FluentValidation;
using TicketBookingSystem.Application.Features.Auth.Commands;

namespace TicketBookingSystem.Application.Features.Auth.Validators;

public class AssignOrganizerRoleCommandValidator : AbstractValidator<AssignOrganizerRoleCommand>
{
    public AssignOrganizerRoleCommandValidator()
    {
        RuleFor(v => v.UserId).NotEmpty().WithMessage("User ID is required to assign a role.");
    }
}