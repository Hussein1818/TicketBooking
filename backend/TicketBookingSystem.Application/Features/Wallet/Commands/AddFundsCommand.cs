using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Wallet.Commands;

public class AddFundsCommand : IRequest<decimal>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public decimal Amount { get; set; }
}

public class AddFundsCommandHandler : IRequestHandler<AddFundsCommand, decimal>
{
    private readonly IApplicationDbContext _context;

    public AddFundsCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<decimal> Handle(AddFundsCommand request, CancellationToken ct)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct);
        if (user == null) throw new NotFoundException(nameof(User), request.UserId);

        user.AddFunds(request.Amount);

        _context.AuditLogs.Add(new AuditLog
        {
            Username = user.UserName ?? string.Empty,
            Action = "Add Funds",
            Details = $"Added {request.Amount} to wallet."
        });

        await _context.SaveChangesAsync(ct);
        return user.WalletBalance;
    }
}