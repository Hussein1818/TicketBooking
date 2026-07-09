namespace TicketBookingSystem.Application.DTOs.PromoCodes;

public class PromoCodeValidationResultDto
{
    public decimal DiscountPercentage { get; set; }
    public string Message { get; set; } = string.Empty;
}