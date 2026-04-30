using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Reviews;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ReviewsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("{eventId}")]
    public async Task<IActionResult> GetEventReviews(int eventId)
    {
        var reviews = await _mediator.Send(new GetEventReviewsQuery { EventId = eventId });
        return Ok(reviews);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> AddReview([FromBody] AddReviewCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty; // 💡 سحبنا الـ GUID

        if (command.Rating < 1 || command.Rating > 5)
            return BadRequest(new { Message = "Rating must be between 1 and 5." });

        var success = await _mediator.Send(command);
        if (!success) return BadRequest(new { Message = "You can only review events you have attended and are already closed." });
        return Ok(new { Message = "Review added successfully! ⭐" });
    }
}