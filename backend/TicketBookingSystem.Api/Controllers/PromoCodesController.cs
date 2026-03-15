using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.PromoCodes.Commands;
using TicketBookingSystem.Application.Features.PromoCodes.Queries;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PromoCodesController : ControllerBase
{
    private readonly IMediator _mediator;

    public PromoCodesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreatePromoCode([FromBody] CreatePromoCodeCommand command)
    {
        var id = await _mediator.Send(command);
        return Ok(new { Message = "Promo code created successfully", Id = id });
    }

    [Authorize]
    [HttpGet("validate/{code}")]
    public async Task<IActionResult> ValidatePromoCode(string code)
    {
        var discount = await _mediator.Send(new ValidatePromoCodeQuery { Code = code });
        if (discount == 0) return BadRequest(new { Message = "Invalid or expired promo code." });
        return Ok(new { DiscountPercentage = discount });
    }
}