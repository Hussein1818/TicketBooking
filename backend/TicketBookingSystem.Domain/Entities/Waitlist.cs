namespace TicketBookingSystem.Domain.Entities;

public class Waitlist
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}