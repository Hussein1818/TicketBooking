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
    public string? JobId { get; set; }

    public Seat Seat { get; set; } = null!;
    public User User { get; set; } = null!;
}