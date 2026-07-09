using System;

namespace TicketBookingSystem.Application.DTOs.Bookings;

public class UserTicketDto
{
    public int BookingId { get; set; }
    public int SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal AmountPaid { get; set; }
    public string QrData { get; set; } = string.Empty;
}