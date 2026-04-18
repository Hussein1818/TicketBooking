using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public IFormFile? ProfilePicture { get; set; }
    }

    // SEC-08: Allowed extensions and max file size for profile picture uploads
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };
    private const long MaxProfilePictureSize = 2 * 1024 * 1024; // 2 MB

    [HttpPut("profile")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var command = new UpdateUserProfileCommand
        {
            UserId = userId,
            FullName = request.FullName,
            NationalId = request.NationalId
        };

        if (request.ProfilePicture != null && request.ProfilePicture.Length > 0)
        {
            // SEC-08: Validate file size
            if (request.ProfilePicture.Length > MaxProfilePictureSize)
                return BadRequest(new { Message = "Profile picture must be smaller than 2 MB." });

            // SEC-08: Validate file extension
            var extension = Path.GetExtension(request.ProfilePicture.FileName);
            if (string.IsNullOrEmpty(extension) || !AllowedImageExtensions.Contains(extension))
                return BadRequest(new { Message = $"Invalid file type. Allowed types: {string.Join(", ", AllowedImageExtensions)}" });

            using var memoryStream = new MemoryStream();
            await request.ProfilePicture.CopyToAsync(memoryStream);
            command.ProfilePictureContent = memoryStream.ToArray();
            command.ProfilePictureExtension = extension;
        }

        var result = await _mediator.Send(command);

        if (result)
            return Ok(new { Message = "Profile updated and Fan ID generated successfully!" });

        return BadRequest("Failed to update profile.");
    }

    [HttpGet("fan-id/download")]
    public async Task<IActionResult> DownloadFanId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var query = new GetFanIdPdfQuery { UserId = userId };
        var pdfBytes = await _mediator.Send(query);

        return File(pdfBytes, "application/pdf", $"FanID_{userId}.pdf");
    }
}