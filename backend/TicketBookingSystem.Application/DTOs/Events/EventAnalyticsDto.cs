namespace TicketBookingSystem.Application.DTOs.Events;

public class EventAnalyticsDto
{
    public int EventId { get; set; }
    public decimal TotalNetRevenue { get; set; }
    public int TicketsSold { get; set; }
    public int RemainingTickets { get; set; }
    public int TotalCapacity { get; set; }
    public string Velocity { get; set; } = string.Empty;
}