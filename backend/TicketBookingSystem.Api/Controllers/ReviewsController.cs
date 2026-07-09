using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Reviews.Commands;
using TicketBookingSystem.Application.Features.Reviews.Queries;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReviewsController(IMediator mediator)
    {
        _mediator = mediator;
    }

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
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        if (string.IsNullOrEmpty(command.UserId))
            return Unauthorized();

        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "You can only review events you have attended and are already closed, or you have already reviewed this event." });

        return Ok(new { Message = "Review added successfully! ⭐" });
    }
}