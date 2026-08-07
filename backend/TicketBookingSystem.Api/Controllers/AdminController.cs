using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Admin.Commands;
using TicketBookingSystem.Application.Features.Admin.Queries;
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
            // Fix: Use NameIdentifier to get the actual User ID instead of Username
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
        // Fix: Use NameIdentifier to safely link the event to the correct user ID
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
}