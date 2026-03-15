namespace TicketBookingSystem.Domain.Entities;

public class Event
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public bool IsClosed { get; set; } = false;
    public int MaxTicketsPerUser { get; set; } = 1;
    public string Category { get; set; } = "General";
    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}