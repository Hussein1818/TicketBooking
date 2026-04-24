using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Events.Commands;
using TicketBookingSystem.Application.Features.Events.Queries;
using TicketBookingSystem.Application.Features.Seats.Commands;
using TicketBookingSystem.Application.Features.Seats.Queries;
using TicketBookingSystem.Application.Features.Events.Queries.GetEventById;
using System.Threading.Tasks;

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
    public async Task<IActionResult> GetAllEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var events = await _mediator.Send(new GetEventsQuery { Page = page, PageSize = pageSize });
        return Ok(events);
    }

    [Authorize(Roles = "Admin,Organizer")]
    [HttpPost]
    [Consumes("multipart/form-data")] 
    public async Task<IActionResult> CreateEvent([FromForm] ManageEventCommand command) 
    {
        command.Id = 0;
        command.CurrentUserId = User.Identity?.Name ?? string.Empty;
        command.IsAdmin = User.IsInRole("Admin");

        var eventId = await _mediator.Send(command);
        return Ok(new { Message = "Event created successfully", EventId = eventId });
    }

    [Authorize(Roles = "Admin,Organizer")]
    [HttpPut("{eventId}")]
    [Consumes("multipart/form-data")] 
    public async Task<IActionResult> UpdateEvent(int eventId, [FromForm] ManageEventCommand command) 
    {
        command.Id = eventId;
        command.CurrentUserId = User.Identity?.Name ?? string.Empty;
        command.IsAdmin = User.IsInRole("Admin");

        await _mediator.Send(command);
        return Ok(new { Message = "Event updated successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{eventId}/seats")]
    public async Task<IActionResult> CreateSeats(int eventId, [FromBody] CreateSeatsCommand command)
    {
        command.EventId = eventId;
        var seatsCount = await _mediator.Send(command);
        return Ok(new { Message = $"Successfully created {seatsCount} seats for Event {eventId}" });
    }

    [HttpGet("{eventId}/seats")]
    public async Task<IActionResult> GetEventSeats(int eventId)
    {
        var seats = await _mediator.Send(new GetEventSeatsQuery { EventId = eventId });
        return Ok(seats);
    }
    [HttpGet("{eventId}")]
    public async Task<IActionResult> GetEventById(int eventId)
    {
        var query = new TicketBookingSystem.Application.Features.Events.Queries.GetEventById.GetEventByIdQuery { EventId = eventId };
        var eventDetails = await _mediator.Send(query);
        return Ok(eventDetails);
    }
}