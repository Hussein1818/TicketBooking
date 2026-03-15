using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TicketBookingSystem.Application.Features.Bookings.Commands;
using TicketBookingSystem.Application.Features.Bookings.Queries;

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

    [Authorize]
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmBookingCommand command)
    {
        var paymentUrl = await _mediator.Send(command);

        if (string.IsNullOrEmpty(paymentUrl))
            return BadRequest(new { Message = "Booking expired or seat unavailable." });

        return Ok(new { PaymentUrl = paymentUrl });
    }
    [Authorize]
    [HttpGet("my-tickets/{userId}")]
    public async Task<IActionResult> GetMyTickets(string userId)
    {
        var result = await _mediator.Send(new GetUserTicketsQuery { UserId = userId });
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> PaymentCallback([FromQuery] string success, [FromQuery] string merchant_order_id)
    {
        bool isSuccess = success?.ToLower() == "true";
        int.TryParse(merchant_order_id, out int bookingId);

        await _mediator.Send(new CompletePaymentCommand { BookingId = bookingId, Success = isSuccess });

        string htmlContent = $@"
            <html>
                <head><meta charset='utf-8'></head>
                <body style='font-family: Arial; text-align: center; padding-top: 50px;'>
                    <h2 style='color: {(isSuccess ? "#27ae60" : "#e74c3c")};'>
                        {(isSuccess ? "Payment Processed Successfully! 🎉" : "Payment Failed! ❌")}
                    </h2>
                    <p>Redirecting you back to the stadium in 3 seconds...</p>
                    <script>
                        setTimeout(function() {{ window.location.href = '/index.html'; }}, 3000);
                    </script>
                </body>
            </html>";

        return Content(htmlContent, "text/html; charset=utf-8");
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateTicket([FromBody] ValidateTicketQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

  
    [Authorize]
    [HttpDelete("cancel/{bookingId}/{userId}")]
    public async Task<IActionResult> CancelBooking(int bookingId, string userId)
    {
        var success = await _mediator.Send(new CancelBookingCommand { BookingId = bookingId, UserId = userId });

        if (!success) return BadRequest(new { Message = "Cannot cancel this booking. Event may have already started." });

        return Ok(new { Message = "Booking cancelled successfully." });
    }
    [Authorize]
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferTicket([FromBody] TicketBookingSystem.Application.Features.Bookings.Commands.TransferTicketCommand command)
    {
        command.FromUsername = User.Identity?.Name ?? command.FromUsername;
        var success = await _mediator.Send(command);

        if (!success) return BadRequest(new { Message = "Transfer failed. Please check the target username." });
        return Ok(new { Message = "Ticket transferred successfully! 🎁" });
    }
}