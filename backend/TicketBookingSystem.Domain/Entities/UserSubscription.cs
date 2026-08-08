using System;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Domain.Entities;

public class UserSubscription
{
    public int Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public SubscriptionTier Tier { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public decimal AmountPaid { get; private set; }
    public string PaymentMethod { get; private set; } = string.Empty;
    public bool IsCancelled { get; private set; }

    public User User { get; private set; } = null!;

    private UserSubscription() { }

    public UserSubscription(string userId, SubscriptionTier tier, DateTime startDate, DateTime endDate, decimal amountPaid, string paymentMethod)
    {
        UserId = userId;
        Tier = tier;
        StartDate = startDate;
        EndDate = endDate;
        AmountPaid = amountPaid;
        PaymentMethod = paymentMethod;
        IsCancelled = false;
    }

    public void Cancel()
    {
        IsCancelled = true;
        Tier = SubscriptionTier.None;
    }
}