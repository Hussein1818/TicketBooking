using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Waitlists.Commands;

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
        
        command.UserId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier) ?? string.Empty;

        var success = await _mediator.Send(command);
        if (!success)
            return BadRequest(new { Message = "You are already on the waitlist for this event." });

        return Ok(new { Message = "Successfully joined the waitlist!" });
    }
}