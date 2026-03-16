using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TicketBookingSystem.Application.Features.Bookings.Commands;
using TicketBookingSystem.Application.Features.Bookings.Queries;
using System.Threading.Tasks;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BookingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [Authorize]
    [HttpPost]
    [EnableRateLimiting("BookingPolicy")]
    public async Task<IActionResult> BookSeat([FromBody] BookSeatCommand command)
    {
        var bookingId = await _mediator.Send(command);
        return Ok(new { Message = "Seat booked successfully!", BookingId = bookingId });
    }
    // confirms the booking and initiates the payment process, returning a payment URL to the client.
    [Authorize]
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmBookingCommand command)
    {
        var paymentUrl = await _mediator.Send(command);

        if (string.IsNullOrEmpty(paymentUrl))
            return BadRequest(new { Message = "Booking expired or seat unavailable." });

        return Ok(new { PaymentUrl = paymentUrl });
    }
    // allows users to view their booked tickets, ensuring they can only access their own bookings.
    [Authorize]
    [HttpGet("my-tickets")]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = User.Identity?.Name;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var tickets = await _mediator.Send(new GetUserTicketsQuery { UserId = userId });
        return Ok(tickets);
    }
    //handles the payment gateway's callback, displaying a user-friendly message based on the payment outcome and redirecting back to the homepage after a short delay.
    [HttpGet("callback")]
    public IActionResult PaymentCallback([FromQuery] bool success, [FromQuery] int merchant_order_id)
    {
        string statusText = success ? "Payment Successful! 🎉" : "Payment Failed ❌";
        string color = success ? "green" : "red";

        var htmlContent = $@"
            <html>
                <body style='text-align:center; padding-top:50px; font-family:Arial;'>
                    <h1 style='color:{color};'>{statusText}</h1>
                    <p>Order ID: {merchant_order_id}</p>
                    <script>
                        setTimeout(function() {{ window.location.href = '/index.html'; }}, 3000);
                    </script>
                </body>
            </html>";

        return Content(htmlContent, "text/html; charset=utf-8");
    }
    // allows staff and admins to validate tickets at the event entrance, ensuring only authorized personnel can perform this action.
    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateTicket([FromBody] ValidateTicketQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    // enables users to cancel their bookings, with checks to prevent cancellations after the event has started or if the booking belongs to another user.
    [Authorize]
    [HttpDelete("cancel/{bookingId}")]
    public async Task<IActionResult> CancelBooking(int bookingId)
    {
        var userId = User.Identity?.Name;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var success = await _mediator.Send(new CancelBookingCommand { BookingId = bookingId, UserId = userId });

        if (!success)
            return BadRequest(new { Message = "Cannot cancel this booking. Event may have already started or it belongs to someone else." });

        return Ok(new { Message = "Booking cancelled successfully." });
    }
    // allows users to transfer their booked tickets to another user, with checks to ensure the target user exists and the booking belongs to the sender.
    [Authorize]
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferTicket([FromBody] TicketBookingSystem.Application.Features.Bookings.Commands.TransferTicketCommand command)
    {
        command.FromUsername = User.Identity?.Name ?? command.FromUsername;

        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Transfer failed. Please check the target username." });

        return Ok(new { Message = "Ticket transferred successfully!" });
    }
}