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

    // Both Admins and regular users can view the list of events and their details
    [HttpGet]
    public async Task<IActionResult> GetAllEvents([FromQuery] GetEventsQuery query)
    {
        var events = await _mediator.Send(query);
        return Ok(events);
    }

    // Admins can create new events with details like name, date, venue, and ticket price
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] ManageEventCommand command)
    {
        command.Id = 0;
        var eventId = await _mediator.Send(command);
        return Ok(new { Message = "Event created successfully", EventId = eventId });
    }

    // Admins can update event details, including closing the event for ticket sales
    [Authorize(Roles = "Admin")]
    [HttpPut("{eventId}")]
    public async Task<IActionResult> UpdateEvent(int eventId, [FromBody] ManageEventCommand command)
    {
        command.Id = eventId;
        await _mediator.Send(command);
        return Ok(new { Message = "Event updated successfully." });
    }

    // Admins can create seats for an event, specifying seat numbers and types (e.g., VIP, Regular)
    [Authorize(Roles = "Admin")]
    [HttpPost("{eventId}/seats")]
    public async Task<IActionResult> CreateSeats(int eventId, [FromBody] CreateSeatsCommand command)
    {
        command.EventId = eventId;
        var seatsCount = await _mediator.Send(command);
        return Ok(new { Message = $"Successfully created {seatsCount} seats for Event {eventId}" });
    }

    // Both Admins and regular users can view available seats for an event, including seat types and prices
    [HttpGet("{eventId}/seats")]
    public async Task<IActionResult> GetEventSeats(int eventId)
    {
        var seats = await _mediator.Send(new GetEventSeatsQuery { EventId = eventId });
        return Ok(seats);
    }
}