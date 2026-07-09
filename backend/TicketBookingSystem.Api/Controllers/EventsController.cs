using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Events.Commands;
using TicketBookingSystem.Application.Features.Events.Queries;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EventsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? category = null)
    {
        var events = await _mediator.Send(new GetEventsQuery { Page = page, PageSize = pageSize, Category = category });
        return Ok(events);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreateEvent([FromForm] ManageEventCommand command)
    {
        command.Id = 0;
        command.CurrentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        command.IsAdmin = User.IsInRole(Roles.Admin);

        if (string.IsNullOrEmpty(command.CurrentUserId)) return Unauthorized();

        var eventId = await _mediator.Send(command);
        return Ok(new { Message = "Event created successfully.", EventId = eventId });
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpPut("{eventId}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateEvent(int eventId, [FromForm] ManageEventCommand command)
    {
        command.Id = eventId;
        command.CurrentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        command.IsAdmin = User.IsInRole(Roles.Admin);

        if (string.IsNullOrEmpty(command.CurrentUserId)) return Unauthorized();

        await _mediator.Send(command);
        return Ok(new { Message = "Event updated successfully." });
    }

    [HttpGet("{eventId}")]
    public async Task<IActionResult> GetEventById(int eventId)
    {
        var query = new GetEventByIdQuery { EventId = eventId };
        var eventDetails = await _mediator.Send(query);
        return Ok(eventDetails);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpGet("{eventId}/analytics")]
    public async Task<IActionResult> GetEventAnalytics(int eventId)
    {
        var analytics = await _mediator.Send(new GetEventAnalyticsQuery { EventId = eventId });
        return Ok(analytics);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpDelete("{eventId}")]
    public async Task<IActionResult> DeleteEvent(int eventId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var command = new DeleteEventCommand
        {
            EventId = eventId,
            CurrentUserId = userId,
            IsAdmin = User.IsInRole(Roles.Admin)
        };

        await _mediator.Send(command);
        return Ok(new { Message = "Event deleted successfully." });
    }
}