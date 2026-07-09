using MediatR;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Auth.Commands;

public class RegisterUserCommand : IRequest<string>
{
    public string FullName { get; set; } = string.Empty;
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
            FullName = request.FullName,
            UserName = request.Username,
            Email = request.Email
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new BadRequestException($"Registration failed: {errors}");
        }

        await _userManager.AddToRoleAsync(user, Roles.Customer);

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        var plainTextBytes = Encoding.UTF8.GetBytes(token);
        var encodedToken = Convert.ToBase64String(plainTextBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        var confirmationLink = $"{request.ClientURI}?userId={user.Id}&token={encodedToken}";

        var emailBody = $"<h3>Welcome to Ticket Booking System!</h3><p>Please confirm your account by <a href='{confirmationLink}'>clicking here</a>.</p>";

        await _emailService.SendEmailAsync(user.Email, "Confirm Your Email - Ticket Booking", emailBody);

        return user.Id;
    }
}