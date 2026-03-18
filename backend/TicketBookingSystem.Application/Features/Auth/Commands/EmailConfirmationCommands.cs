using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Auth.Commands;

public class ConfirmEmailCommand : IRequest<bool>
{
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}

public class ConfirmEmailCommandHandler : IRequestHandler<ConfirmEmailCommand, bool>
{
    private readonly UserManager<User> _userManager;

    public ConfirmEmailCommandHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<bool> Handle(ConfirmEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null) throw new BadRequestException("Invalid User ID.");

        var decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

        if (!result.Succeeded) throw new BadRequestException("Email confirmation failed or token expired.");

        return true;
    }
}

public class ResendConfirmationEmailCommand : IRequest<bool>
{
    public string Email { get; set; } = string.Empty;
    public string ClientURI { get; set; } = string.Empty;
}

public class ResendConfirmationEmailCommandHandler : IRequestHandler<ResendConfirmationEmailCommand, bool>
{
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;

    public ResendConfirmationEmailCommandHandler(UserManager<User> userManager, IEmailService emailService)
    {
        _userManager = userManager;
        _emailService = emailService;
    }

    public async Task<bool> Handle(ResendConfirmationEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || await _userManager.IsEmailConfirmedAsync(user))
            return true; 

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var confirmationLink = $"{request.ClientURI}?userId={user.Id}&token={encodedToken}";
        var emailBody = $"<h3>Welcome back!</h3><p>Please confirm your account by <a href='{confirmationLink}'>clicking here</a>.</p>";

        await _emailService.SendEmailAsync(user.Email, "Confirm Your Email", emailBody);

        return true;
    }
}