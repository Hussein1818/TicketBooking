using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Wallet.Commands;

public class TransferFundsCommand : IRequest<bool>
{
    [JsonIgnore]
    public string FromUserId { get; set; } = string.Empty;

    public string ToUsername { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class TransferFundsCommandHandler : IRequestHandler<TransferFundsCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public TransferFundsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(TransferFundsCommand request, CancellationToken ct)
    {
        if (request.FromUserId.Equals(request.ToUsername, StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Cannot transfer funds to your own account.");

        var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.FromUserId, ct);
        if (sender == null) return false;

        var receiver = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.ToUsername, ct);
        if (receiver == null)
            throw new NotFoundException(nameof(User), request.ToUsername);

        if (!sender.DeductFunds(request.Amount))
            throw new BadRequestException("Transfer failed: Insufficient wallet balance.");

        receiver.AddFunds(request.Amount);

        _context.AuditLogs.Add(new AuditLog
        {
            Username = sender.UserName ?? string.Empty,
            Action = "Wallet Transfer Out",
            Details = $"Transferred {request.Amount} {AppConstants.DefaultCurrency} to @{receiver.UserName}."
        });

        _context.AuditLogs.Add(new AuditLog
        {
            Username = receiver.UserName ?? string.Empty,
            Action = "Wallet Transfer In",
            Details = $"Received {request.Amount} {AppConstants.DefaultCurrency} from @{sender.UserName}."
        });

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("Concurrency conflict occurred while transferring funds. Please try again.");
        }

        return true;
    }
}