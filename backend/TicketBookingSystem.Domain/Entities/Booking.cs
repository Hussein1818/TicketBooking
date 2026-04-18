using System;

namespace TicketBookingSystem.Domain.Entities;

public class Booking
{
    public int Id { get; set; }
    public int SeatId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public decimal AmountPaid { get; set; }
    public string Currency { get; set; } = "EGP";
    public decimal ExchangeRate { get; set; } = 1.0m;

    
    public decimal PlatformFee { get; set; }
    public decimal OrganizerEarnings { get; set; }

    public string? JobId { get; set; }
    public int? OrderId { get; set; }

    // Ticket Scanning State
    public bool IsUsed { get; private set; }
    public DateTime? ScannedAt { get; private set; }

    public void MarkAsUsed()
    {
        IsUsed = true;
        ScannedAt = DateTime.UtcNow;
    }

    public Seat Seat { get; set; } = null!;
    public User User { get; set; } = null!;
    public Order? Order { get; set; }
}