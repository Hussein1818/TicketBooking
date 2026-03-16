using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        var username = User.Identity?.Name;

        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        var balance = await _mediator.Send(new GetWalletBalanceQuery
        {
            Username = username
        });

        return Ok(new { Balance = balance });
    }

    [HttpPost("add-funds")]
    public async Task<IActionResult> AddFunds([FromBody] AddFundsCommand command)
    {
        
        command.Username = User.Identity?.Name ?? command.Username;

        var newBalance = await _mediator.Send(command);

        return Ok(new
        {
            Message = "Funds added successfully!",
            Balance = newBalance
        });
    }

    [HttpPost("pay")]
    public async Task<IActionResult> PayWithWallet([FromBody] PayWithWalletCommand command)
    {
        var username = User.Identity?.Name;

        if (string.IsNullOrEmpty(username))
            return Unauthorized();

        
        command.Username = username;

        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Insufficient funds or invalid booking." });

        return Ok(new { Message = "Payment successful via Wallet! 🎉" });
    }
}