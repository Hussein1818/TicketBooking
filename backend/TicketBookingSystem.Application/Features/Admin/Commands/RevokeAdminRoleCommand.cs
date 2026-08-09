using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Admin.Commands;

public class RevokeAdminRoleCommand : IRequest<bool>
{
    public string TargetUserId { get; set; } = string.Empty;

    [JsonIgnore]
    public string CurrentAdminId { get; set; } = string.Empty;
}

public class RevokeAdminRoleCommandHandler : IRequestHandler<RevokeAdminRoleCommand, bool>
{
    private readonly UserManager<User> _userManager;

    public RevokeAdminRoleCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<bool> Handle(RevokeAdminRoleCommand request, CancellationToken cancellationToken)
    {
        if (request.TargetUserId == request.CurrentAdminId)
            throw new BadRequestException("You cannot revoke the Admin role from yourself.");

        var user = await _userManager.FindByIdAsync(request.TargetUserId);
        if (user == null)
            throw new NotFoundException(nameof(User), request.TargetUserId);

        var isInRole = await _userManager.IsInRoleAsync(user, Roles.Admin);
        if (!isInRole)
            throw new ConflictException("User is not assigned to the Admin role.");

        var result = await _userManager.RemoveFromRoleAsync(user, Roles.Admin);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Failed to revoke Admin role: {errors}");
        }

        return true;
    }
}