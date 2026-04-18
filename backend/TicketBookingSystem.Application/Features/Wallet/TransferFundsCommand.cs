using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Wallet;

public class TransferFundsCommand : IRequest<bool>
{
    public string FromUsername { get; set; } = string.Empty;
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
        // 1. Business Validation
        if (request.FromUsername.Equals(request.ToUsername, StringComparison.OrdinalIgnoreCase))
            throw new BadRequestException("Cannot transfer funds to your own account.");

        // 2. Fetch Users
        var sender = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.FromUsername, ct);
        if (sender == null) return false;

        var receiver = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.ToUsername, ct);
        if (receiver == null)
            throw new NotFoundException(nameof(User), request.ToUsername);

        // 3. Perform Transaction (using the domain methods)
        if (!sender.DeductFunds(request.Amount))
            throw new BadRequestException("Transfer failed: Insufficient wallet balance.");

        receiver.AddFunds(request.Amount);

        // 4. Financial Audit Logging
        _context.AuditLogs.Add(new AuditLog
        {
            Username = sender.UserName!,
            Action = "Wallet Transfer Out",
            Details = $"Transferred {request.Amount} EGP to @{receiver.UserName}."
        });

        _context.AuditLogs.Add(new AuditLog
        {
            Username = receiver.UserName!,
            Action = "Wallet Transfer In",
            Details = $"Received {request.Amount} EGP from @{sender.UserName}."
        });

        // 5. Save with Concurrency Protection
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