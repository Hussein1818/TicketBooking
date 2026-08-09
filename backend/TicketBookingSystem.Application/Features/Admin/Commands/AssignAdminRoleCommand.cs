using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Admin.Commands;

public class AssignAdminRoleCommand : IRequest<bool>
{
    public string TargetUserId { get; set; } = string.Empty;
}

public class AssignAdminRoleCommandHandler : IRequestHandler<AssignAdminRoleCommand, bool>
{
    private readonly UserManager<User> _userManager;

    public AssignAdminRoleCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<bool> Handle(AssignAdminRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.TargetUserId);
        if (user == null)
            throw new NotFoundException(nameof(User), request.TargetUserId);

        var isInRole = await _userManager.IsInRoleAsync(user, Roles.Admin);
        if (isInRole)
            throw new ConflictException("User is already assigned to the Admin role.");

        var result = await _userManager.AddToRoleAsync(user, Roles.Admin);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Failed to assign Admin role: {errors}");
        }

        return true;
    }
}