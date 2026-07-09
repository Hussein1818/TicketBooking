using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Wallet;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Application.Features.Wallet.Queries;

public class GetWalletBalanceQuery : IRequest<WalletBalanceDto>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
}

public class GetWalletBalanceQueryHandler : IRequestHandler<GetWalletBalanceQuery, WalletBalanceDto>
{
    private readonly IApplicationDbContext _context;

    public GetWalletBalanceQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WalletBalanceDto> Handle(GetWalletBalanceQuery request, CancellationToken ct)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);

        return new WalletBalanceDto
        {
            Balance = user?.WalletBalance ?? 0,
            Currency = AppConstants.DefaultCurrency
        };
    }
}