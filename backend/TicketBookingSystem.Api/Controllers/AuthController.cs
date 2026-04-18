using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
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
        if (string.IsNullOrEmpty(command.ClientURI))
            command.ClientURI = $"{Request.Scheme}://{Request.Host}/api/auth/confirm-email";

        var userId = await _mediator.Send(command);
        return Ok(new { Message = "User registered successfully. Please check your email to confirm your account.", UserId = userId });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginQuery query)
    {
        var authResponse = await _mediator.Send(query);
        return Ok(authResponse);
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
    {
        await _mediator.Send(new ConfirmEmailCommand { UserId = userId, Token = token });
        return Ok(new { Message = "Email confirmed successfully. now You can login." });
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationEmailCommand command)
    {
        if (string.IsNullOrEmpty(command.ClientURI))
            command.ClientURI = $"{Request.Scheme}://{Request.Host}/api/auth/confirm-email";

        await _mediator.Send(command);
        return Ok(new { Message = "If the email is registered and not confirmed, a confirmation link has been sent." });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command)
    {
        var authResponse = await _mediator.Send(command);
        return Ok(authResponse);
    }

    [Authorize]
    [HttpPost("revoke-token")]
    public async Task<IActionResult> RevokeToken()
    {
        var username = User.Identity?.Name ?? string.Empty;
        await _mediator.Send(new RevokeTokenCommand { Username = username });
        return Ok(new { Message = "Token revoked successfully." });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        //  Always use the authenticated user's identity, never trust the request body
        command.Username = User.Identity?.Name ?? string.Empty;

        var success = await _mediator.Send(command);
        if (!success)
            return BadRequest(new { Message = "Invalid current password." });

        return Ok(new { Message = "Password updated successfully." });
    }

    
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command)
    {
        if (string.IsNullOrEmpty(command.ClientURI))
            command.ClientURI = $"{Request.Scheme}://{Request.Host}/api/auth/reset-password";

        await _mediator.Send(command);
        return Ok(new { Message = "If the email is registered and confirmed, a password reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
    {
        await _mediator.Send(command);
        return Ok(new { Message = "Password has been reset successfully." });
    }

    [Authorize(Roles = "Admin,Organizer")]
    [HttpPost("blast-campaign")]
    public async Task<IActionResult> LaunchBlastCampaign([FromBody] TicketBookingSystem.Application.Features.Admin.Commands.BlastCampaignCommand command)
    {
        
        command.CurrentUserId = User.Identity?.Name ?? string.Empty;
        command.IsAdmin = User.IsInRole("Admin");

        var usersNotified = await _mediator.Send(command);

        if (usersNotified == 0)
            return BadRequest(new { Message = "No attendees found to notify for this event." });

        return Ok(new { Message = $"Blast campaign launched successfully! {usersNotified} attendees are being notified." });
    }
}