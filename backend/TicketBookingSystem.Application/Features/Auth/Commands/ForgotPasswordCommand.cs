using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Auth.Commands;

public class ForgotPasswordCommand : IRequest<bool>
{
    public string Email { get; set; } = string.Empty;
    public string ClientURI { get; set; } = string.Empty; 
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, bool>
{
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(UserManager<User> userManager, IEmailService emailService)
    {
        _userManager = userManager;
        _emailService = emailService;
    }

    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

       
        if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
            return true;

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var resetLink = $"{request.ClientURI}?email={user.Email}&token={encodedToken}";
        var emailBody = $"<h3>Reset Your Password</h3><p>We received a password reset request. Please reset your password by <a href='{resetLink}'>clicking here</a>.</p>";

        await _emailService.SendEmailAsync(user.Email, "Reset Password", emailBody);

        return true;
    }
}