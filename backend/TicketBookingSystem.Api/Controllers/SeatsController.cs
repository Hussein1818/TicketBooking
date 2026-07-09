using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Seats.Commands;
using TicketBookingSystem.Application.Features.Seats.Queries;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SeatsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SeatsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("event/{eventId}")]
    public async Task<IActionResult> GetEventSeats(int eventId)
    {
        var seats = await _mediator.Send(new GetEventSeatsQuery { EventId = eventId });
        return Ok(seats);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Organizer)]
    [HttpPost]
    public async Task<IActionResult> CreateSeats([FromBody] CreateSeatsCommand command)
    {
        command.CurrentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        command.IsAdmin = User.IsInRole(Roles.Admin);

        if (string.IsNullOrEmpty(command.CurrentUserId)) return Unauthorized();

        var addedSeatsCount = await _mediator.Send(command);

        return Ok(new { Message = $"{addedSeatsCount} seats created successfully." });
    }
}