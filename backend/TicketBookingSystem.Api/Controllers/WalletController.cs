using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TicketBookingSystem.Application.Features.Wallet;

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
        var balance = await _mediator.Send(new GetWalletBalanceQuery { UserId = userId });
        return Ok(new { Balance = balance });
    }

    [HttpPost("add-funds")]
    public async Task<IActionResult> AddFunds([FromBody] AddFundsCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var newBalance = await _mediator.Send(command);
        return Ok(new { Message = "Funds added successfully!", Balance = newBalance });
    }

    [HttpPost("pay")]
    public async Task<IActionResult> PayWithWallet([FromBody] PayWithWalletCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var success = await _mediator.Send(command);
        if (!success) return BadRequest(new { Message = "Insufficient funds or invalid booking." });
        return Ok(new { Message = "Payment successful via Wallet! 🎉" });
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferFunds([FromBody] TransferFundsCommand command)
    {
        command.FromUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var success = await _mediator.Send(command);
        if (!success) return BadRequest(new { Message = "Transfer failed. Please verify the target username." });
        return Ok(new { Message = $"Successfully transferred {command.Amount} to @{command.ToUsername}! 💸" });
    }
}