using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Services;

public class PricingService : IPricingService
{
    private readonly IApplicationDbContext _context;

    /// <summary>Platform fee percentage deducted from the ticket price.</summary>
    private const decimal PlatformFeePercentage = 0.10m; // 10%

    public PricingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PricingResult> CalculateDiscountedPriceAsync(
        decimal basePriceEgp,
        User user,
        string? promoCode,
        CancellationToken cancellationToken)
    {
        decimal originalPrice = basePriceEgp;
        decimal discountedPrice = basePriceEgp;

        // 1. Apply tier-based subscription discount
        if (user.Tier != SubscriptionTier.None
            && user.TierExpiryDate.HasValue
            && user.TierExpiryDate.Value > DateTime.UtcNow)
        {
            decimal tierDiscount = user.Tier switch
            {
                SubscriptionTier.Silver => 0.10m,
                SubscriptionTier.Gold => 0.20m,
                SubscriptionTier.VIP => 0.30m,
                _ => 0m
            };
            discountedPrice -= discountedPrice * tierDiscount;
        }

        // 2. Apply promo code discount (if valid, active, not expired, and within usage limits)
        if (!string.IsNullOrWhiteSpace(promoCode))
        {
            var promo = await _context.PromoCodes
                .FirstOrDefaultAsync(p => p.Code == promoCode
                    && p.IsActive
                    && p.ExpirationDate > DateTime.UtcNow, cancellationToken);

            if (promo != null && promo.CurrentUsage < promo.MaxUsage)
            {
                discountedPrice -= discountedPrice * (promo.DiscountPercentage / 100);
                promo.CurrentUsage += 1;
            }
        }

        return new PricingResult
        {
            OriginalPriceEgp = originalPrice,
            FinalPriceEgp = discountedPrice
        };
    }

    public void ApplyRevenueSplit(Booking booking)
    {
        booking.PlatformFee = Math.Round(booking.AmountPaid * PlatformFeePercentage, 2);
        booking.OrganizerEarnings = booking.AmountPaid - booking.PlatformFee;
    }
}
