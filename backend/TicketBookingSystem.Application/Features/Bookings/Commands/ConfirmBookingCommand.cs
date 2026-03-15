using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class ConfirmBookingCommand : IRequest<string>
{
    public int SeatId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? PromoCode { get; set; }
}

public class ConfirmBookingCommandHandler : IRequestHandler<ConfirmBookingCommand, string>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentService _paymentService;

    public ConfirmBookingCommandHandler(IApplicationDbContext context, IPaymentService paymentService)
    {
        _context = context;
        _paymentService = paymentService;
    }

    public async Task<string> Handle(ConfirmBookingCommand request, CancellationToken cancellationToken)
    {
        var seat = await _context.Seats.FindAsync(new object[] { request.SeatId }, cancellationToken);

        if (seat == null || seat.Status != SeatStatus.Locked)
            return string.Empty;

        var userBooking = await _context.Bookings
            .Where(b => b.SeatId == request.SeatId && b.UserId == request.UserId)
            .OrderByDescending(b => b.BookingDate)
            .FirstOrDefaultAsync(cancellationToken);

        if (userBooking == null)
            return string.Empty;

        decimal finalPrice = seat.Price;

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var promo = await _context.PromoCodes
                .FirstOrDefaultAsync(p => p.Code == request.PromoCode && p.IsActive, cancellationToken);

            if (promo != null && promo.CurrentUsage < promo.MaxUsage)
            {
                decimal discountAmount = finalPrice * (promo.DiscountPercentage / 100);
                finalPrice -= discountAmount;

                promo.CurrentUsage += 1;
            }
        }

        userBooking.AmountPaid = finalPrice;
        await _context.SaveChangesAsync(cancellationToken);

        var paymentUrl = await _paymentService.GetPaymentUrlAsync(userBooking.Id, finalPrice);

        return paymentUrl;
    }
}