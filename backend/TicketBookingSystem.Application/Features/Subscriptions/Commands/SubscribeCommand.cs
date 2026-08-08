using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Subscriptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Subscriptions.Commands;

public class SubscribeCommand : IRequest<SubscriptionResultDto?>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public SubscriptionTier Tier { get; set; }
    public int Months { get; set; } = 1;
    public string PaymentMethod { get; set; } = "Wallet";
}

public class SubscribeCommandHandler : IRequestHandler<SubscribeCommand, SubscriptionResultDto?>
{
    private readonly IApplicationDbContext _context;

    public SubscribeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SubscriptionResultDto?> Handle(SubscribeCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null || request.Tier == SubscriptionTier.None || request.Months <= 0) return null;

        decimal monthlyPrice = request.Tier switch
        {
            SubscriptionTier.Silver => 200m,
            SubscriptionTier.Gold => 500m,
            SubscriptionTier.VIP => 1000m,
            _ => 0m
        };

        decimal totalPrice = monthlyPrice * request.Months;

        if (request.PaymentMethod.Equals("Wallet", StringComparison.OrdinalIgnoreCase))
        {
            if (!user.DeductFunds(totalPrice)) return null;
        }

        user.UpgradeTier(request.Tier, request.Months);

        var subscriptionRecord = new UserSubscription(
            user.Id,
            request.Tier,
            DateTime.UtcNow,
            DateTime.UtcNow.AddMonths(request.Months),
            totalPrice,
            request.PaymentMethod
        );

        _context.UserSubscriptions.Add(subscriptionRecord);

        _context.AuditLogs.Add(new AuditLog
        {
            Username = user.UserName ?? string.Empty,
            Action = "Subscription Upgrade",
            Details = $"Upgraded to {request.Tier} for {request.Months} months via {request.PaymentMethod}."
        });

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return null;
        }

        return new SubscriptionResultDto
        {
            Tier = request.Tier.ToString(),
            Message = $"Subscription upgraded successfully via {request.PaymentMethod}! 🎉"
        };
    }
}