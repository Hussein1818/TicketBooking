namespace TicketBookingSystem.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public System.DateTime Timestamp { get; set; } = System.DateTime.UtcNow;
}