using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Wallet.Commands;
using TicketBookingSystem.Application.Features.Wallet.Queries;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IMediator _mediator;

    public WalletController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _mediator.Send(new GetWalletBalanceQuery { UserId = userId });
        return Ok(result);
    }

    [HttpPost("add-funds")]
    public async Task<IActionResult> AddFunds([FromBody] AddFundsCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.UserId)) return Unauthorized();

        var newBalance = await _mediator.Send(command);
        return Ok(new { Message = "Funds added successfully!", Balance = newBalance });
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferFunds([FromBody] TransferFundsCommand command)
    {
        command.FromUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.FromUserId)) return Unauthorized();

        var success = await _mediator.Send(command);

        if (!success) return BadRequest(new { Message = "Transfer failed. Please verify the target username and your balance." });

        return Ok(new { Message = $"Successfully transferred {command.Amount} to @{command.ToUsername}!" });
    }
}