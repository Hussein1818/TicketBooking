using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Subscriptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Subscriptions.Commands;

public class CancelSubscriptionCommand : IRequest<SubscriptionResultDto>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
}

public class CancelSubscriptionCommandHandler : IRequestHandler<CancelSubscriptionCommand, SubscriptionResultDto>
{
    private readonly IApplicationDbContext _context;

    public CancelSubscriptionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<SubscriptionResultDto> Handle(CancelSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null)
            throw new NotFoundException(nameof(User), request.UserId);

        var activeSubscription = await _context.UserSubscriptions
            .Where(s => s.UserId == request.UserId && !s.IsCancelled && s.EndDate > DateTime.UtcNow)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync(cancellationToken);

        if (activeSubscription == null)
            throw new BadRequestException("No active subscription found to cancel.");

        var timeSinceSubscription = DateTime.UtcNow - activeSubscription.StartDate;

        if (timeSinceSubscription.TotalHours > 24)
            throw new BadRequestException("Subscription cannot be cancelled and refunded after 24 hours.");

        activeSubscription.Cancel();
        user.UpgradeTier(SubscriptionTier.None, 0);

        if (activeSubscription.PaymentMethod.Equals("Wallet", StringComparison.OrdinalIgnoreCase))
        {
            user.AddFunds(activeSubscription.AmountPaid);
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Username = user.UserName ?? string.Empty,
            Action = "Subscription Cancelled",
            Details = $"Cancelled {activeSubscription.Tier} tier. Refunded: {activeSubscription.AmountPaid} to {activeSubscription.PaymentMethod}."
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new SubscriptionResultDto
        {
            Tier = SubscriptionTier.None.ToString(),
            Message = "Subscription cancelled successfully. Eligible refund has been processed."
        };
    }
}