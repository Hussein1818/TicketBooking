using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TicketBookingSystem.Application.Features.Bookings.Commands;
using TicketBookingSystem.Application.Features.Bookings.Queries;
using TicketBookingSystem.Application.Features.Orders.Commands;
using TicketBookingSystem.Application.Features.Wallet;
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
        return Ok(new { Message = "Seat locked successfully! Added to cart.", BookingId = bookingId });
    }

    [Authorize]
    [HttpPost("checkout-paymob")]
    public async Task<IActionResult> CheckoutCart([FromBody] CheckoutCartCommand command)
    {
        command.UserId = User.Identity?.Name ?? string.Empty;
        var paymentUrl = await _mediator.Send(command);

        if (string.IsNullOrEmpty(paymentUrl))
            return BadRequest(new { Message = "Checkout failed. Some seats might be expired or unavailable." });

        return Ok(new { PaymentUrl = paymentUrl });
    }

    [Authorize]
    [HttpPost("checkout-wallet")]
    public async Task<IActionResult> PayCartWithWallet([FromBody] PayWithWalletCommand command)
    {
        command.Username = User.Identity?.Name ?? string.Empty;
        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Insufficient wallet balance or seats expired." });

        return Ok(new { Message = "Cart paid successfully using Wallet! 🎉" });
    }

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

    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateTicket([FromBody] ValidateTicketQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("my-tickets")]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = User.Identity?.Name ?? string.Empty;
        var tickets = await _mediator.Send(new GetUserTicketsQuery { UserId = userId });
        return Ok(tickets);
    }

    [Authorize]
    [HttpDelete("cancel/{bookingId}")]
    public async Task<IActionResult> CancelBooking(int bookingId)
    {
        var userId = User.Identity?.Name ?? string.Empty;
        var success = await _mediator.Send(new CancelBookingCommand { BookingId = bookingId, UserId = userId });

        if (!success)
            return BadRequest(new { Message = "Cannot cancel this booking." });

        return Ok(new { Message = "Booking cancelled successfully." });
    }

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