using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Domain.Entities;

public class Seat
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public SeatStatus Status { get; set; } = SeatStatus.Available;
    
    public byte[] Version { get; set; } = Array.Empty<byte>();

    public Event Event { get; set; } = null!;
}