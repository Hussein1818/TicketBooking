using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Bookings;
using TicketBookingSystem.Application.Features.Bookings.Commands;
using TicketBookingSystem.Application.Features.Bookings.Queries;
using TicketBookingSystem.Application.Features.Orders.Commands;
using TicketBookingSystem.Application.Features.Wallet.Commands;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookingsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IConfiguration _configuration;

    public BookingsController(IMediator mediator, IConfiguration configuration)
    {
        _mediator = mediator;
        _configuration = configuration;
    }

    [Authorize]
    [HttpPost]
    [EnableRateLimiting("BookingPolicy")]
    public async Task<IActionResult> BookSeat([FromBody] BookSeatCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.UserId)) return Unauthorized();

        var bookingId = await _mediator.Send(command);
        return Ok(new { Message = "Seat locked successfully! Added to cart.", BookingId = bookingId });
    }

    [Authorize]
    [HttpPost("checkout-paymob")]
    public async Task<IActionResult> CheckoutCart([FromBody] CheckoutCartCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.UserId)) return Unauthorized();

        var paymentUrl = await _mediator.Send(command);

        if (string.IsNullOrEmpty(paymentUrl))
            return BadRequest(new { Message = "Checkout failed. Some seats might be expired or unavailable." });

        return Ok(new { PaymentUrl = paymentUrl });
    }

    [Authorize]
    [HttpPost("checkout-wallet")]
    public async Task<IActionResult> PayCartWithWallet([FromBody] PayWithWalletCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.UserId)) return Unauthorized();

        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Insufficient wallet balance or seats expired." });

        return Ok(new { Message = "Cart paid successfully using Wallet! 🎉" });
    }

    [HttpGet("callback")]
    public IActionResult PaymentCallback([FromQuery] bool success, [FromQuery] int merchant_order_id)
    {
        var allowedOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>();
        var frontendUrl = allowedOrigins?.FirstOrDefault() ?? "http://localhost:5173";

        var redirectUrl = $"{frontendUrl}/payment-result?success={success}&orderId={merchant_order_id}";

        return Redirect(redirectUrl);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Staff + "," + Roles.Organizer)]
    [HttpPost("validate")]
    public async Task<IActionResult> ValidateTicket([FromBody] ValidateTicketQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [Authorize(Roles = Roles.Admin + "," + Roles.Staff + "," + Roles.Organizer)]
    [HttpPost("scan")]
    public async Task<IActionResult> ScanTicket([FromBody] ScanTicketCommand command)
    {
        command.ScannedByUsername = User.Identity?.Name ?? string.Empty;
        var result = await _mediator.Send(command);

        if (result.Status == "Invalid")
            return BadRequest(result);

        if (result.Status == "Already Used")
            return Conflict(result);

        return Ok(result);
    }

    [Authorize]
    [HttpGet("my-tickets")]
    [ProducesResponseType(typeof(List<UserTicketDto>), 200)]
    public async Task<IActionResult> GetMyTickets()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var tickets = await _mediator.Send(new GetUserTicketsQuery { UserId = userId });
        return Ok(tickets);
    }

    [Authorize]
    [HttpDelete("cancel/{bookingId}")]
    public async Task<IActionResult> CancelBooking(int bookingId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var success = await _mediator.Send(new CancelBookingCommand { BookingId = bookingId, UserId = userId });

        if (!success)
            return BadRequest(new { Message = "Cannot cancel this booking." });

        return Ok(new { Message = "Booking cancelled successfully." });
    }

    [Authorize]
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferTicket([FromBody] TransferTicketCommand command)
    {
        command.FromUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.FromUserId)) return Unauthorized();

        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Transfer failed. Please check the target username or ticket ownership." });

        return Ok(new { Message = "Ticket transferred successfully! 🎉" });
    }

    [Authorize]
    [HttpPost("checkout-mock")]
    public async Task<IActionResult> MockCheckout()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var command = new MockCheckoutCommand { UserId = userId };
        var success = await _mediator.Send(command);

        if (!success)
            return BadRequest(new { Message = "Your cart is empty or seats expired." });

        return Ok(new { Message = "Mock payment successful! Tickets are now confirmed and QR codes generated." });
    }

    [Authorize]
    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmBooking([FromBody] ConfirmBookingCommand command)
    {
        command.UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(command.UserId)) return Unauthorized();

        var paymentUrl = await _mediator.Send(command);

        if (string.IsNullOrEmpty(paymentUrl))
            return BadRequest(new { Message = "Failed to confirm booking or generate payment link. Seat might be expired." });

        return Ok(new { Message = "Booking confirmed.", PaymentUrl = paymentUrl });
    }
    [Authorize]
    [HttpGet("{bookingId}/download")]
    public async Task<IActionResult> DownloadTicket(int bookingId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var result = await _mediator.Send(new DownloadTicketQuery { BookingId = bookingId, UserId = userId });

        return File(result.FileData, result.ContentType, result.FileName);
    }
}