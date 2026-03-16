using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Admin.Commands;

public class CreateStaffCommand : IRequest<string>
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public class CreateStaffCommandHandler : IRequestHandler<CreateStaffCommand, string>
{
    private readonly UserManager<User> _userManager;

    public CreateStaffCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<string> Handle(CreateStaffCommand request, CancellationToken cancellationToken)
    {
        var userExists = await _userManager.FindByNameAsync(request.Username);
        if (userExists != null)
            throw new ConflictException("Username is already taken.");

        var emailExists = await _userManager.FindByEmailAsync(request.Email);
        if (emailExists != null)
            throw new ConflictException("Email is already registered.");

        var user = new User
        {
            UserName = request.Username,
            Email = request.Email,
            FullName = request.FullName,
            Role = UserRole.Staff
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Staff creation failed: {errors}");
        }

        return user.Id;
    }
}