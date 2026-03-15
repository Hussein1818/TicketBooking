namespace TicketBookingSystem.Domain.Entities;

public class Review
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    public string Username { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow;
}