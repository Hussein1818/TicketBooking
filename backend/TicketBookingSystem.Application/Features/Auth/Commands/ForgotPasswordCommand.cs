using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

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

        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
            return true;

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        // Pure C# Base64Url Encode
        var plainTextBytes = Encoding.UTF8.GetBytes(token);
        var encodedToken = Convert.ToBase64String(plainTextBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        // Read base URL from appsettings
        var baseUrl = _configuration["AppUrls:ResetPasswordEndpoint"];
        var resetLink = $"{baseUrl}?email={user.Email}&token={encodedToken}";

        var emailBody = $"<h3>Reset Your Password</h3><p>We received a password reset request. Please reset your password by <a href='{resetLink}'>clicking here</a>.</p>";

        await _emailService.SendEmailAsync(user.Email!, "Reset Password", emailBody);

        return true;
    }
}