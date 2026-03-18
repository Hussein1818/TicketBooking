using System.Security.Claims;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
}