using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Subscriptions.Commands;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubscriptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("upgrade")]
    public async Task<IActionResult> UpgradeSubscription([FromBody] SubscribeCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        if (string.IsNullOrEmpty(command.UserId))
            return Unauthorized();

        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Upgrade failed. Check your wallet balance or selected tier." });

        return Ok(new { Message = "Subscription upgraded successfully! 🎉" });
    }
}