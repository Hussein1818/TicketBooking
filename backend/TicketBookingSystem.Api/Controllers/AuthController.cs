using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicketBookingSystem.Application.Features.Auth.Commands;
using TicketBookingSystem.Application.Features.Auth.Queries;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserCommand command)
    {
        var userId = await _mediator.Send(command);
        return Ok(new { Message = "User registered successfully", UserId = userId });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginQuery query)
    {
        var token = await _mediator.Send(query);
        return Ok(new { Token = token });
    }
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] TicketBookingSystem.Application.Features.Auth.Commands.ChangePasswordCommand command)
    {
        
        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Invalid current password." });

        return Ok(new { Message = "Password updated successfully." });
    }
}