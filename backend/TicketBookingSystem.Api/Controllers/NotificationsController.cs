using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Notifications;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var userId = User.Identity?.Name ?? string.Empty;
        var notifications = await _mediator.Send(new GetMyNotificationsQuery { UserId = userId });
        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = User.Identity?.Name ?? string.Empty;
        var success = await _mediator.Send(new MarkNotificationAsReadCommand { NotificationId = id, UserId = userId });

        if (!success)
            return BadRequest(new { Message = "Notification not found or unauthorized." });

        return Ok(new { Message = "Marked as read." });
    }
}