using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Application.DTOs.Pricing;
namespace TicketBookingSystem.Application.Interfaces;

public interface IPricingService
{
    Task<PricingResult> CalculateDiscountedPriceAsync(
        decimal basePriceEgp,
        User user,
        string? promoCode,
        CancellationToken cancellationToken);

    void ApplyRevenueSplit(Booking booking);
}