using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Bookings.Queries;

public class ValidateTicketQuery : IRequest<ValidateTicketResult>
{
    public string QrData { get; set; } = string.Empty;
}

public class ValidateTicketResult
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ValidateTicketQueryHandler : IRequestHandler<ValidateTicketQuery, ValidateTicketResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public ValidateTicketQueryHandler(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ValidateTicketResult> Handle(ValidateTicketQuery request, CancellationToken cancellationToken)
    {
        var cleanData = request.QrData.Trim();

        if (string.IsNullOrEmpty(cleanData) || !cleanData.StartsWith("TICKET|"))
        {
            return new ValidateTicketResult { IsValid = false, Message = $"Invalid ticket format." };
        }

        var parts = cleanData.Split('|');
        if (parts.Length < 4)
        {
            return new ValidateTicketResult { IsValid = false, Message = "Corrupted Ticket Data. Missing Security Signature." };
        }

        if (!int.TryParse(parts[1].Trim(), out int seatId))
        {
            return new ValidateTicketResult { IsValid = false, Message = "Invalid Seat ID in QR." };
        }

        var username = parts[2].Trim().ToLower();
        var providedSignature = parts[3].Trim();

        var rawData = $"TICKET|{seatId}|{username}";
        // SEC-07: Use a dedicated HMAC key for QR codes, separate from JWT signing key
        var secretKey = _configuration["QrCode:HmacKey"]
            ?? throw new InvalidOperationException("QrCode:HmacKey is not configured.");

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var expectedSignature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData)));

        if (providedSignature != expectedSignature)
        {
            return new ValidateTicketResult { IsValid = false, Message = "Ticket signature verification failed. Forged ticket detected!" };
        }

        var seat = await _context.Seats.AsNoTracking().FirstOrDefaultAsync(s => s.Id == seatId, cancellationToken);
        if (seat == null)
        {
            return new ValidateTicketResult { IsValid = false, Message = $"Seat ID {seatId} does not exist in Database." };
        }

        if (seat.Status != SeatStatus.Booked)
        {
            return new ValidateTicketResult { IsValid = false, Message = $"Seat {seat.SeatNumber} is currently not marked as paid." };
        }

        var booking = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.SeatId == seatId)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (booking == null)
        {
            return new ValidateTicketResult { IsValid = false, Message = $"No booking history found for Seat {seat.SeatNumber}." };
        }

        if (booking.UserId.ToLower() != username)
        {
            return new ValidateTicketResult { IsValid = false, Message = $"Owner mismatch! Booked by: {booking.UserId}, Scanned: {username}" };
        }

        return new ValidateTicketResult
        {
            IsValid = true,
            Message = $"Ticket Validated Successfully! Seat: {seat.SeatNumber}, Owner: {booking.UserId}"
        };
    }
}