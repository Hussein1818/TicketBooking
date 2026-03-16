using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Subscriptions.Commands;

public class SubscribeCommand : IRequest<bool>
{
    public string Username { get; set; } = string.Empty;
    public SubscriptionTier Tier { get; set; }
    public int Months { get; set; } = 1;
}

public class SubscribeCommandHandler : IRequestHandler<SubscribeCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public SubscribeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(SubscribeCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.Username, cancellationToken);
        if (user == null) return false;

        if (request.Tier == SubscriptionTier.None || request.Months <= 0) return false;

        decimal monthlyPrice = request.Tier switch
        {
            SubscriptionTier.Silver => 200m,
            SubscriptionTier.Gold => 500m,
            SubscriptionTier.VIP => 1000m,
            _ => 0m
        };

        decimal totalPrice = monthlyPrice * request.Months;

        if (!user.DeductFunds(totalPrice))
            return false;

        user.UpgradeTier(request.Tier, request.Months);

        _context.AuditLogs.Add(new Domain.Entities.AuditLog
        {
            Username = request.Username,
            Action = "Subscription Upgrade",
            Details = $"Upgraded to {request.Tier} for {request.Months} months."
        });

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return false;
        }

        return true;
    }
}