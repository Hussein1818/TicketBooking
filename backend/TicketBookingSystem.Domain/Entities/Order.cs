using System;
using System.Collections.Generic;

namespace TicketBookingSystem.Domain.Entities;

public class Order
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "EGP";
    public string Status { get; set; } = "Pending";

    public User User { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}