using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class ScanTicketCommand : IRequest<ScanTicketResult>
{
    public string QrData { get; set; } = string.Empty;
    public string ScannedByUsername { get; set; } = string.Empty;
}

public class ScanTicketResult
{
    public string Status { get; set; } = string.Empty; // Valid, Invalid, Already Used
    public string Message { get; set; } = string.Empty;
}

public class ScanTicketCommandHandler : IRequestHandler<ScanTicketCommand, ScanTicketResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public ScanTicketCommandHandler(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ScanTicketResult> Handle(ScanTicketCommand request, CancellationToken cancellationToken)
    {
        var cleanData = request.QrData.Trim();

        if (string.IsNullOrEmpty(cleanData) || !cleanData.StartsWith("TICKET|"))
        {
            return new ScanTicketResult { Status = "Invalid", Message = "Invalid ticket format." };
        }

        var parts = cleanData.Split('|');
        if (parts.Length < 4)
        {
            return new ScanTicketResult { Status = "Invalid", Message = "Corrupted Ticket Data. Missing Security Signature." };
        }

        if (!int.TryParse(parts[1].Trim(), out int seatId))
        {
            return new ScanTicketResult { Status = "Invalid", Message = "Invalid Seat ID in QR." };
        }

        var username = parts[2].Trim().ToLower();
        var providedSignature = parts[3].Trim();

        // 1. Validate Signature (HMAC)
        var rawData = $"TICKET|{seatId}|{username}";
        var secretKey = _configuration["QrCode:HmacKey"]
            ?? throw new InvalidOperationException("QrCode:HmacKey is not configured.");

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var expectedSignature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData)));

        if (providedSignature != expectedSignature)
        {
            return new ScanTicketResult { Status = "Invalid", Message = "Ticket signature verification failed. Forged ticket detected!" };
        }

        // 2. Lookup Booking and Seat Status (Optimized without Includes)
        var booking = await _context.Bookings
            .Where(b => b.SeatId == seatId)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (booking == null)
        {
            return new ScanTicketResult { Status = "Invalid", Message = $"No booking history found for Seat ID {seatId}." };
        }

        if (booking.UserId.ToLower() != username)
        {
            return new ScanTicketResult { Status = "Invalid", Message = $"Owner mismatch! Booked by: {booking.UserId}, Scanned: {username}" };
        }

        var seatStatus = await _context.Seats
            .Where(s => s.Id == seatId)
            .Select(s => s.Status)
            .FirstOrDefaultAsync(cancellationToken);

        if (seatStatus != SeatStatus.Booked)
        {
            return new ScanTicketResult { Status = "Invalid", Message = "This seat is currently not marked as paid/booked in the system." };
        }

        // 3. Idempotency Check
        if (booking.IsUsed)
        {
            return new ScanTicketResult { Status = "Already Used", Message = $"Ticket was already scanned at {booking.ScannedAt:g}." };
        }

        // 4. State Mutation & Audit Tracking
        booking.MarkAsUsed();

        _context.AuditLogs.Add(new AuditLog
        {
            Username = request.ScannedByUsername,
            Action = "Ticket Scanned",
            Details = $"Successfully checked-in ticket for Booking #{booking.Id} (Seat ID: {seatId}) belonging to {booking.UserId}."
        });

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // If two scanners hit this exact booking at the identical millisecond, one wins, the other hits this conflict.
            return new ScanTicketResult { Status = "Already Used", Message = "Ticket was scanned just moments ago by another device!" };
        }

        return new ScanTicketResult
        {
            Status = "Valid",
            Message = "Ticket Scanned and Checked-in Successfully!"
        };
    }
}
