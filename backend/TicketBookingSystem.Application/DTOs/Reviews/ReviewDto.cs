using System;

namespace TicketBookingSystem.Application.DTOs.Reviews;

public class ReviewDto
{
    public string Username { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}