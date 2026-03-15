using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Waitlists.Commands;
using System.Threading.Tasks;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WaitlistController : ControllerBase
{
    private readonly IMediator _mediator;

    public WaitlistController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinWaitlistCommand command)
    {
        var success = await _mediator.Send(command);
        if (!success)
            return BadRequest(new { Message = "You are already on the waitlist for this event." });

        return Ok(new { Message = "Successfully joined the waitlist!" });
    }
}