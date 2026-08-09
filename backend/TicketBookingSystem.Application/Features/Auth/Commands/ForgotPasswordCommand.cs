using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Auth.Commands;

public class ForgotPasswordCommand : IRequest<bool>
{
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, bool>
{
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public ForgotPasswordCommandHandler(UserManager<User> userManager, IEmailService emailService, IConfiguration configuration)
    {
        _userManager = userManager;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null || !await _userManager.IsEmailConfirmedAsync(user))
            return true;

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        var plainTextBytes = Encoding.UTF8.GetBytes(token);
        var encodedToken = Convert.ToBase64String(plainTextBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        var allowedOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>();
        var frontendUrl = _configuration["AppUrls:FrontendBaseUrl"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl}/reset-password?email={request.Email}&token={encodedToken}";

        var emailBody = $"<h3>Reset Password</h3><p>Please reset your password by <a href='{resetLink}'>clicking here</a>.</p>";
        await _emailService.SendEmailAsync(user.Email!, "Reset Your Password - Ticket Booking", emailBody);

        return true;
    }
}