using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.PromoCodes.Queries;

public class ValidatePromoCodeQuery : IRequest<decimal>
{
    public string Code { get; set; } = string.Empty;
}

public class ValidatePromoCodeQueryHandler : IRequestHandler<ValidatePromoCodeQuery, decimal>
{
    private readonly IApplicationDbContext _context;

    public ValidatePromoCodeQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> Handle(ValidatePromoCodeQuery request, CancellationToken cancellationToken)
    {
        var promo = await _context.PromoCodes
            .FirstOrDefaultAsync(p => p.Code == request.Code.ToUpper().Trim() && p.IsActive, cancellationToken);

        if (promo == null || promo.CurrentUsage >= promo.MaxUsage)
            return 0;

        return promo.DiscountPercentage;
    }
}