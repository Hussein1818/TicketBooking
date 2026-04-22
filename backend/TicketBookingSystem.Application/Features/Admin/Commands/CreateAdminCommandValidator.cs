using FluentValidation;

namespace TicketBookingSystem.Application.Features.Admin.Commands;

public class CreateAdminCommandValidator : AbstractValidator<CreateAdminCommand>
{
    public CreateAdminCommandValidator()
    {
        RuleFor(v => v.Username).NotEmpty().MinimumLength(3).MaximumLength(50);
        RuleFor(v => v.Email).NotEmpty().EmailAddress();
        RuleFor(v => v.Password).NotEmpty().MinimumLength(8);
        RuleFor(v => v.FullName).NotEmpty().MaximumLength(100);
    }
}