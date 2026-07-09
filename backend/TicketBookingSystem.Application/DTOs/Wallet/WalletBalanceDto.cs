namespace TicketBookingSystem.Application.DTOs.Wallet;

public class WalletBalanceDto
{
    public decimal Balance { get; set; }
    public string Currency { get; set; } = string.Empty;
}