using FluentValidation;
using System.IO;
using System.Linq;
using TicketBookingSystem.Application.Features.Users.Commands;
using TicketBookingSystem.Application.Features.Users.Queries;

namespace TicketBookingSystem.Application.Features.Users.Validators;


public class GetUserProfileQueryValidator : AbstractValidator<GetUserProfileQuery>
{
    public GetUserProfileQueryValidator()
    {
        RuleFor(v => v.UserId).NotEmpty().WithMessage("User ID is required.");
    }
}

