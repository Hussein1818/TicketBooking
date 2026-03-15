using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}