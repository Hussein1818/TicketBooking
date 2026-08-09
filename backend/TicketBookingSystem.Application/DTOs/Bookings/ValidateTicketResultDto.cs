namespace TicketBookingSystem.Application.DTOs.Bookings;

public class ValidateTicketResultDto
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
}