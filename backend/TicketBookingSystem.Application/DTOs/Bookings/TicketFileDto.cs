namespace TicketBookingSystem.Application.DTOs.Bookings;

public class TicketFileDto
{
    public byte[] FileData { get; set; } = System.Array.Empty<byte>();
    public string ContentType { get; set; } = "application/pdf";
    public string FileName { get; set; } = string.Empty;
}