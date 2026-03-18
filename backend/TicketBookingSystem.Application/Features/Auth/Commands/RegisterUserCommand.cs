using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Auth.Commands;

public class RegisterUserCommand : IRequest<string>
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ClientURI { get; set; } = string.Empty; 
}

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, string>
{
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;

    public RegisterUserCommandHandler(UserManager<User> userManager, IEmailService emailService)
    {
        _userManager = userManager;
        _emailService = emailService;
    }

    public async Task<string> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var userExists = await _userManager.FindByNameAsync(request.Username);
        if (userExists != null)
            throw new ConflictException("Username is already taken.");

        var emailExists = await _userManager.FindByEmailAsync(request.Email);
        if (emailExists != null)
            throw new ConflictException("Email is already registered.");

        var user = new User
        {
            UserName = request.Username,
            Email = request.Email,
            Role = UserRole.Customer
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Registration failed: {errors}");
        }

        
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

       
        var confirmationLink = $"{request.ClientURI}?userId={user.Id}&token={encodedToken}";
        var emailBody = $"<h3>Welcome to Hussein Stadium!</h3><p>Please confirm your account by <a href='{confirmationLink}'>clicking here</a>.</p>";

        await _emailService.SendEmailAsync(user.Email, "Confirm Your Email", emailBody);

        return user.Id;
    }
}