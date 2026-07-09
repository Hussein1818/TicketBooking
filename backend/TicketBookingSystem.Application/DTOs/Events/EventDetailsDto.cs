using System;

namespace TicketBookingSystem.Application.DTOs.Events;

public class EventDetailsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int AttendingCount { get; set; }
    public int FullRefundDays { get; set; }
    public int PartialRefundDays { get; set; }
    public decimal PartialRefundPercentage { get; set; }
    public string OrganizerId { get; set; } = string.Empty;
    public string OrganizerName { get; set; } = string.Empty;
    public int TotalSeats { get; set; }
    public int AvailableSeats { get; set; }
}