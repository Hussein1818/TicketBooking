using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Admin.Commands;
using TicketBookingSystem.Application.Features.Admin.Queries;
using TicketBookingSystem.Application.Features.Auth.Commands;
using TicketBookingSystem.Application.Features.Events.Commands;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var query = new GetAdvancedDashboardQuery
        {
            CurrentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
            IsAdmin = User.IsInRole(Roles.Admin)
        };
        var stats = await _mediator.Send(query);
        return Ok(stats);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("logs")]
    public async Task<IActionResult> GetSystemLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var logs = await _mediator.Send(new GetSystemLogsQuery { Page = page, PageSize = pageSize });
        return Ok(logs);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpPost("manage-event")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ManageEvent([FromForm] ManageEventCommand command)
    {
        command.CurrentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        command.IsAdmin = User.IsInRole(Roles.Admin);

        if (string.IsNullOrEmpty(command.CurrentUserId))
            return Unauthorized(new { Message = "User ID not found in token." });

        await _mediator.Send(command);
        return Ok(new { Message = "Event managed successfully." });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("create-staff")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffCommand command)
    {
        var userId = await _mediator.Send(command);
        return Ok(new { Message = "Staff user created successfully.", UserId = userId });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("create-admin")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminCommand command)
    {
        var userId = await _mediator.Send(command);
        return Ok(new { Message = "Admin created successfully.", UserId = userId });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _mediator.Send(new GetAllUsersQuery());
        return Ok(users);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("users/{userId}/assign-organizer")]
    public async Task<IActionResult> AssignOrganizerRole(string userId)
    {
        await _mediator.Send(new AssignOrganizerRoleCommand { UserId = userId });
        return Ok(new { Message = "User has been successfully upgraded to Organizer." });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("users/{userId}/revoke-organizer")]
    public async Task<IActionResult> RevokeOrganizerRole(string userId)
    {
        await _mediator.Send(new RevokeOrganizerRoleCommand { UserId = userId });
        return Ok(new { Message = "Organizer role has been revoked successfully." });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("users/{userId}/assign-admin")]
    public async Task<IActionResult> AssignAdminRole(string userId)
    {
        await _mediator.Send(new AssignAdminRoleCommand { TargetUserId = userId });
        return Ok(new { Message = "User has been successfully upgraded to Admin." });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("users/{userId}/revoke-admin")]
    public async Task<IActionResult> RevokeAdminRole(string userId)
    {
        var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        await _mediator.Send(new RevokeAdminRoleCommand { TargetUserId = userId, CurrentAdminId = currentAdminId });
        return Ok(new { Message = "Admin role has been revoked successfully." });
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        await _mediator.Send(new DeleteUserCommand { TargetUserId = userId, CurrentAdminId = currentAdminId });
        return Ok(new { Message = "User deleted successfully." });
    }
}