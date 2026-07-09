namespace TicketBookingSystem.Application.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public IList<string> Roles { get; set; } = new List<string>();

}