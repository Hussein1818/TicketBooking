using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Users;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Users.Queries;

public class GetUserProfileQuery : IRequest<UserProfileDto>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
}

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto>
{
    private readonly IApplicationDbContext _context;

    public GetUserProfileQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfileDto> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
            throw new NotFoundException("User", request.UserId);

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            NationalId = user.NationalId,
            Address = user.Address ?? string.Empty,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            FanIdNumber = user.FanIdNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            WalletBalance = user.WalletBalance,
            LoyaltyPoints = user.LoyaltyPoints,
            Tier = user.Tier.ToString()
        };
    }
}