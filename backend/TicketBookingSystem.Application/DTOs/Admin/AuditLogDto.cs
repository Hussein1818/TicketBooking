using System;

namespace TicketBookingSystem.Application.DTOs.Admin;

public class AuditLogDto
{
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}