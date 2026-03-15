using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Events.Commands;
using TicketBookingSystem.Application.Features.Events.Queries;
using TicketBookingSystem.Application.Features.Seats.Commands;
using TicketBookingSystem.Application.Features.Seats.Queries;
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
    public async Task<IActionResult> GetAllEvents([FromQuery] GetEventsQuery query)
    {
        var events = await _mediator.Send(query);
        return Ok(events);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventCommand command)
    {
        var eventId = await _mediator.Send(command);
        return Ok(new { Message = "Event created successfully", EventId = eventId });
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
}