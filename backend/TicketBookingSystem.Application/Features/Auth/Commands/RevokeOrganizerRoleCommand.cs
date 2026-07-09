using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Auth.Commands;

public class RevokeOrganizerRoleCommand : IRequest<bool>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
}

public class RevokeOrganizerRoleCommandHandler : IRequestHandler<RevokeOrganizerRoleCommand, bool>
{
    private readonly UserManager<User> _userManager;

    public RevokeOrganizerRoleCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<bool> Handle(RevokeOrganizerRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);

        if (user == null)
            throw new NotFoundException(nameof(User), request.UserId);

        var isInRole = await _userManager.IsInRoleAsync(user, Roles.Organizer);
        if (!isInRole)
            throw new ConflictException("User is not assigned to the Organizer role.");

        var result = await _userManager.RemoveFromRoleAsync(user, Roles.Organizer);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Failed to revoke Organizer role: {errors}");
        }

        return true;
    }
}