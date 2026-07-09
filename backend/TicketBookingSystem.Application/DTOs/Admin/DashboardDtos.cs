using System.Collections.Generic;

namespace TicketBookingSystem.Application.DTOs.Admin;

public class AdvancedDashboardDto
{
    public int TotalEvents { get; set; }
    public int TotalUsers { get; set; }
    public int TotalBookedSeats { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<TopEventDto> TopEvents { get; set; } = new();
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
    public List<ActiveCampaignDto> ActiveCampaigns { get; set; } = new();
}

public class TopEventDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}

public class TopCustomerDto
{
    public string Username { get; set; } = string.Empty;
    public int TicketsBought { get; set; }
}

public class ActiveCampaignDto
{
    public int EventId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Velocity { get; set; }
    public decimal GrossRevenue { get; set; }
}