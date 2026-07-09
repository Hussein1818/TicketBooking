using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Bookings;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class ScanTicketCommand : IRequest<ScanTicketResultDto>
{
    public string QrData { get; set; } = string.Empty;

    [JsonIgnore]
    public string ScannedByUsername { get; set; } = string.Empty;
}

public class ScanTicketCommandHandler : IRequestHandler<ScanTicketCommand, ScanTicketResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public ScanTicketCommandHandler(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ScanTicketResultDto> Handle(ScanTicketCommand request, CancellationToken cancellationToken)
    {
        var cleanData = request.QrData.Trim();

        if (string.IsNullOrEmpty(cleanData) || !cleanData.StartsWith("TICKET|"))
        {
            return new ScanTicketResultDto { Status = "Invalid", Message = "Invalid ticket format." };
        }

        var parts = cleanData.Split('|');
        if (parts.Length != 4)
        {
            return new ScanTicketResultDto { Status = "Invalid", Message = "Malformed ticket data." };
        }

        if (!int.TryParse(parts[1], out int seatId))
        {
            return new ScanTicketResultDto { Status = "Invalid", Message = "Invalid Seat ID." };
        }

        var username = parts[2];
        var providedSignature = parts[3];

        var booking = await _context.Bookings
            .Where(b => b.SeatId == seatId)
            .OrderByDescending(b => b.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (booking == null)
        {
            return new ScanTicketResultDto { Status = "Invalid", Message = $"No booking history found for Seat {seatId}." };
        }

        if (booking.UserId.ToLower() != username)
        {
            return new ScanTicketResultDto { Status = "Invalid", Message = $"Owner mismatch! Booked by: {booking.UserId}, Scanned: {username}" };
        }

        var seatStatus = await _context.Seats
            .Where(s => s.Id == seatId)
            .Select(s => s.Status)
            .FirstOrDefaultAsync(cancellationToken);

        if (seatStatus != SeatStatus.Booked)
        {
            return new ScanTicketResultDto { Status = "Invalid", Message = "This seat is currently not marked as paid/booked in the system." };
        }

        if (booking.IsUsed)
        {
            return new ScanTicketResultDto { Status = "Already Used", Message = $"Ticket was already scanned at {booking.ScannedAt:g}." };
        }

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
            return new ScanTicketResultDto { Status = "Already Used", Message = "Ticket was scanned just moments ago by another device!" };
        }

        return new ScanTicketResultDto
        {
            Status = "Valid",
            Message = "Ticket Scanned and Checked-in Successfully!"
        };
    }
}