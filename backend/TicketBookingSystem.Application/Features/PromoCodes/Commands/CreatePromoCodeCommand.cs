using MediatR;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.PromoCodes.Commands;

public class CreatePromoCodeCommand : IRequest<int>
{
    public string Code { get; set; } = string.Empty;
    public decimal DiscountPercentage { get; set; }
    public int MaxUsage { get; set; }
    public DateTime ExpirationDate { get; set; }
}

public class CreatePromoCodeCommandHandler : IRequestHandler<CreatePromoCodeCommand, int>
{
    private readonly IApplicationDbContext _context;

    public CreatePromoCodeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> Handle(CreatePromoCodeCommand request, CancellationToken cancellationToken)
    {
        // Input validation is handled by CreatePromoCodeCommandValidator in the pipeline.

        var promo = new PromoCode
        {
            Code = request.Code.ToUpper().Trim(),
            DiscountPercentage = request.DiscountPercentage,
            MaxUsage = request.MaxUsage,
            CurrentUsage = 0,
            IsActive = true,
            ExpirationDate = request.ExpirationDate
        };

        _context.PromoCodes.Add(promo);
        await _context.SaveChangesAsync(cancellationToken);

        return promo.Id;
    }
}