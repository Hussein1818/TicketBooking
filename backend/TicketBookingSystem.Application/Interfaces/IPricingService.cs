using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Interfaces;

/// <summary>
/// Centralizes pricing logic: tier discounts, promo code application, and revenue split.
/// Eliminates duplication across ConfirmBooking, CheckoutCart, PayWithWallet, and CompletePayment handlers.
/// </summary>
public interface IPricingService
{
    /// <summary>
    /// Calculates the final discounted price given a base price, user tier, and optional promo code.
    /// If a valid promo code is provided, its usage count is incremented.
    /// </summary>
    Task<PricingResult> CalculateDiscountedPriceAsync(
        decimal basePriceEgp,
        User user,
        string? promoCode,
        CancellationToken cancellationToken);

    /// <summary>
    /// Applies the revenue split (platform fee vs organizer earnings) to a booking.
    /// </summary>
    void ApplyRevenueSplit(Booking booking);
}

public class PricingResult
{
    /// <summary>Final price after all discounts applied (in EGP).</summary>
    public decimal FinalPriceEgp { get; set; }

    /// <summary>Original price before discounts (in EGP), used for proportional split across bookings.</summary>
    public decimal OriginalPriceEgp { get; set; }
}
