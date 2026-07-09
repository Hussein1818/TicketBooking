namespace TicketBookingSystem.Application.DTOs.Seats;

public class SeatDto
{
    public int Id { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty; 
}