using System;
using System.Collections.Generic;

namespace TicketBookingSystem.Domain.Entities;

public class Event
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public DateTime EventDate { get; private set; }
    public string Venue { get; private set; } = string.Empty;
    public bool IsClosed { get; private set; } = false;
    public int MaxTicketsPerUser { get; private set; } = 1;
    public string Category { get; private set; } = "General";

    
    public string OrganizerId { get; private set; } = string.Empty;

    private readonly List<Seat> _seats = new();
    public IReadOnlyCollection<Seat> Seats => _seats.AsReadOnly();

    private Event() { }

    public Event(string name, DateTime eventDate, string venue, int maxTicketsPerUser, string category, string organizerId)
    {
        Name = name;
        EventDate = eventDate;
        Venue = venue;
        MaxTicketsPerUser = maxTicketsPerUser > 0 ? maxTicketsPerUser : 1;
        Category = string.IsNullOrWhiteSpace(category) ? "General" : category;
        OrganizerId = organizerId;
    }

    public void UpdateDetails(string name, DateTime eventDate, string venue, bool isClosed, int maxTicketsPerUser, string category)
    {
        Name = name;
        EventDate = eventDate;
        Venue = venue;
        IsClosed = isClosed;
        MaxTicketsPerUser = maxTicketsPerUser > 0 ? maxTicketsPerUser : 1;
        Category = string.IsNullOrWhiteSpace(category) ? "General" : category;
    }
}