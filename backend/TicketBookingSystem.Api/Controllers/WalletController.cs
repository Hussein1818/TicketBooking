using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Wallet;
using System.Threading.Tasks;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IMediator _mediator;
    public WalletController(IMediator mediator) => _mediator = mediator;

    // هنا خلينا الرابط يستقبل اليوزرنيم صريح
    [HttpGet("balance/{username}")]
    public async Task<IActionResult> GetBalance(string username)
    {
        var balance = await _mediator.Send(new GetWalletBalanceQuery { Username = username });
        return Ok(new { Balance = balance });
    }

    [HttpPost("add-funds")]
    public async Task<IActionResult> AddFunds([FromBody] AddFundsCommand command)
    {
        var newBalance = await _mediator.Send(command);
        return Ok(new { Message = "Funds added successfully!", Balance = newBalance });
    }

    [HttpPost("pay")]
    public async Task<IActionResult> PayWithWallet([FromBody] PayWithWalletCommand command)
    {
        var success = await _mediator.Send(command);
        if (!success) return BadRequest(new { Message = "Insufficient funds or invalid booking." });
        return Ok(new { Message = "Payment successful via Wallet! 🎉" });
    }
}