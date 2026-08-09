using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.PromoCodes;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.PromoCodes.Queries;

public class ValidatePromoCodeQuery : IRequest<PromoCodeValidationResultDto>
{
    public string Code { get; set; } = string.Empty;
}

public class ValidatePromoCodeQueryHandler : IRequestHandler<ValidatePromoCodeQuery, PromoCodeValidationResultDto>
{
    private readonly IApplicationDbContext _context;

    public ValidatePromoCodeQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PromoCodeValidationResultDto> Handle(ValidatePromoCodeQuery request, CancellationToken cancellationToken)
    {
        var promo = await _context.PromoCodes
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == request.Code.ToUpper().Trim()
                && p.IsActive
                && p.ExpirationDate > DateTime.UtcNow, cancellationToken);

        if (promo == null || promo.CurrentUsage >= promo.MaxUsage)
            return new PromoCodeValidationResultDto { DiscountPercentage = 0, Message = "Invalid or expired promo code." };

        return new PromoCodeValidationResultDto { DiscountPercentage = promo.DiscountPercentage, Message = "Promo code is valid." };
    }
}