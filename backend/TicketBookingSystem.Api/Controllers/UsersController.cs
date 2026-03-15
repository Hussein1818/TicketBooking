using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        command.UserId = userId;

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

        
        return File(pdfBytes, "application/pdf", "Hussein_Stadium_FanID.pdf");
    }
}