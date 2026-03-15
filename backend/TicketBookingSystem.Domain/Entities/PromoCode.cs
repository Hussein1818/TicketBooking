using System;

namespace TicketBookingSystem.Domain.Entities;

public class PromoCode
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountPercentage { get; set; }
    public int MaxUsage { get; set; }
    public int CurrentUsage { get; set; }
    public bool IsActive { get; set; }
    public DateTime ExpirationDate { get; set; }
}