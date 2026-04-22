using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Admin;
using TicketBookingSystem.Application.Features.Admin.Commands;
using TicketBookingSystem.Application.Features.Events.Commands;
using System.Threading.Tasks;

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

    [Authorize(Roles = "Admin,Organizer")]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var query = new GetAdvancedDashboardQuery
        {
            CurrentUserId = User.Identity?.Name ?? string.Empty,
            IsAdmin = User.IsInRole("Admin")
        };
        var stats = await _mediator.Send(query);
        return Ok(stats);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("logs")]
    public async Task<IActionResult> GetSystemLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var logs = await _mediator.Send(new GetSystemLogsQuery { Page = page, PageSize = pageSize });
        return Ok(logs);
    }

    [Authorize(Roles = "Admin,Organizer")]
    [HttpPost("manage-event")]
    [Consumes("multipart/form-data")] 
    public async Task<IActionResult> ManageEvent([FromForm] ManageEventCommand command) 
    {
        command.CurrentUserId = User.Identity?.Name ?? string.Empty;
        command.IsAdmin = User.IsInRole("Admin");

        await _mediator.Send(command);
        return Ok(new { Message = "Event updated successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("create-staff")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffCommand command)
    {
        var userId = await _mediator.Send(command);
        return Ok(new { Message = "Staff user created successfully.", UserId = userId });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("create-admin")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminCommand command)
    {
        var userId = await _mediator.Send(command);
        return Ok(new { Message = "Admin created successfully.", UserId = userId });
    }
}