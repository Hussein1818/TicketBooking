using MediatR;
using Microsoft.AspNetCore.Identity;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Admin.Commands;

public class DeleteUserCommand : IRequest<bool>
{
    public string TargetUserId { get; set; } = string.Empty;

    [JsonIgnore]
    public string CurrentAdminId { get; set; } = string.Empty;
}

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand, bool>
{
    private readonly UserManager<User> _userManager;

    public DeleteUserCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<bool> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        if (request.TargetUserId == request.CurrentAdminId)
            throw new BadRequestException("You cannot delete your own admin account.");

        var user = await _userManager.FindByIdAsync(request.TargetUserId);
        if (user == null)
            throw new NotFoundException(nameof(User), request.TargetUserId);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Failed to delete user: {errors}");
        }

        return true;
    }
}