using Microsoft.AspNetCore.Identity;
using System;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Domain.Entities;

public class User : IdentityUser
{
    public decimal WalletBalance { get; private set; } = 0;
    public UserRole Role { get; set; } = UserRole.Customer;
    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string ProfilePictureUrl { get; set; } = string.Empty;
    public string FanIdNumber { get; set; } = string.Empty;
    public byte[] Version { get; set; } = Array.Empty<byte>();

    public SubscriptionTier Tier { get; private set; } = SubscriptionTier.None;
    public DateTime? TierExpiryDate { get; private set; }

    public void AddFunds(decimal amount)
    {
        if (amount > 0)
        {
            WalletBalance += amount;
        }
    }

    public bool DeductFunds(decimal amount)
    {
        if (amount <= 0 || WalletBalance < amount)
        {
            return false;
        }

        WalletBalance -= amount;
        return true;
    }

    public void UpgradeTier(SubscriptionTier tier, int months)
    {
        Tier = tier;
        TierExpiryDate = DateTime.UtcNow.AddMonths(months);
    }
}