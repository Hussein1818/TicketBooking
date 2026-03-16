using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Admin;
using TicketBookingSystem.Application.Features.Admin.Commands;
using TicketBookingSystem.Application.Features.Events.Commands;
using System.Threading.Tasks;

namespace TicketBookingSystem.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }
    //1.dashboard statistics
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _mediator.Send(new GetAdvancedDashboardQuery());
        return Ok(stats);
    }
    //2.system logs
    [HttpGet("logs")]
    public async Task<IActionResult> GetSystemLogs()
    {
        var logs = await _mediator.Send(new GetSystemLogsQuery());
        return Ok(logs);
    }
    //3.manage events
    [HttpPost("manage-event")]
    public async Task<IActionResult> ManageEvent([FromBody] ManageEventCommand command)
    {
        await _mediator.Send(command);
        return Ok(new { Message = "Event updated successfully." });
    }
    //4.create staff user
    [HttpPost("create-staff")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffCommand command)
    {
        var userId = await _mediator.Send(command);
        return Ok(new { Message = "Staff user created successfully.", UserId = userId });
    }
}