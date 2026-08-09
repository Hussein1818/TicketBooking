using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Users.Commands;
using TicketBookingSystem.Application.Features.Users.Queries;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPut("profile")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateUserProfileCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        if (string.IsNullOrEmpty(command.UserId))
            return Unauthorized();

        var profilePictureUrl = await _mediator.Send(command);

        return Ok(new
        {
            Message = "Profile updated and Fan ID generated successfully!",
            ProfilePictureUrl = profilePictureUrl
        });
    }

    [HttpGet("fan-id/download")]
    public async Task<IActionResult> DownloadFanId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var query = new GetFanIdPdfQuery { UserId = userId };
        var pdfBytes = await _mediator.Send(query);

        if (pdfBytes == null || pdfBytes.Length == 0)
            return BadRequest(new { Message = "Fan ID not found. Please complete your profile first to generate it." });

        return File(pdfBytes, "application/pdf", $"FanID_{userId}.pdf");
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var profile = await _mediator.Send(new GetUserProfileQuery { UserId = userId });

        return Ok(profile);
    }
}