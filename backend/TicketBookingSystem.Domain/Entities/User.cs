using Microsoft.AspNetCore.Identity;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Domain.Entities;

public class User : IdentityUser
{
    public decimal WalletBalance { get; private set; } = 0;

    public UserRole Role { get; set; } = UserRole.Customer;

    public void AddFunds(decimal amount)
    {
        if (amount > 0)
        {
            WalletBalance += amount;
        }
    }

    public bool DeductFunds(decimal amount)
    {
        if (amount <= 0 || WalletBalance < amount)
        {
            return false;
        }

        WalletBalance -= amount;
        return true;
    }
}