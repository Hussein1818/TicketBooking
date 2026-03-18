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

    public int LoyaltyPoints { get; private set; } = 0;

    // Refresh Token Fields
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public void AddFunds(decimal amount)
    {
        if (amount > 0) WalletBalance += amount;
    }

    public bool DeductFunds(decimal amount)
    {
        if (amount <= 0 || WalletBalance < amount) return false;
        WalletBalance -= amount;
        return true;
    }

    public void UpgradeTier(SubscriptionTier tier, int months)
    {
        Tier = tier;
        TierExpiryDate = DateTime.UtcNow.AddMonths(months);
    }

    public void AddLoyaltyPoints(int points)
    {
        if (points <= 0) return;

        LoyaltyPoints += points;

        int conversionThreshold = 1000;
        decimal rewardAmount = 100m;

        while (LoyaltyPoints >= conversionThreshold)
        {
            LoyaltyPoints -= conversionThreshold;
            AddFunds(rewardAmount);
        }
    }
}