using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
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

    // SEC-08: Allowed extensions and max file size for profile picture uploads
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };
    private const long MaxProfilePictureSize = 2 * 1024 * 1024; // 2 MB

    [HttpPut("profile")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateUserProfileCommand command)
    {
       
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        command.UserId = userId;

        if (command.ProfilePicture != null && command.ProfilePicture.Length > 0)
        {
            // SEC-08: Validate file size
            if (command.ProfilePicture.Length > MaxProfilePictureSize)
                return BadRequest(new { Message = "Profile picture must be smaller than 2 MB." });

            // SEC-08: Validate file extension
            var extension = Path.GetExtension(command.ProfilePicture.FileName);
            if (string.IsNullOrEmpty(extension) || !AllowedImageExtensions.Contains(extension))
                return BadRequest(new { Message = $"Invalid file type. Allowed types: {string.Join(", ", AllowedImageExtensions)}" });
        }

        
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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var query = new GetFanIdPdfQuery { UserId = userId };
        var pdfBytes = await _mediator.Send(query);

        if (pdfBytes == null || pdfBytes.Length == 0)
            return BadRequest(new { Message = "Fan ID not found. Please complete your profile first to generate it." });

        return File(pdfBytes, "application/pdf", $"FanID_{userId}.pdf");
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _mediator.Send(new TicketBookingSystem.Application.Features.Users.Queries.GetUserProfileQuery { UserId = userId });
        return Ok(profile);
    }
}