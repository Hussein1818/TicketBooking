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
            using var memoryStream = new MemoryStream();
            await request.ProfilePicture.CopyToAsync(memoryStream);
            command.ProfilePictureContent = memoryStream.ToArray();
            command.ProfilePictureExtension = Path.GetExtension(request.ProfilePicture.FileName);
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