using MediatR;
using Microsoft.AspNetCore.Identity;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Auth.Queries;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class LoginQuery : IRequest<AuthResponseDto>
{
    
    public string UsernameOrEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginQueryHandler : IRequestHandler<LoginQuery, AuthResponseDto>
{
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;

    public LoginQueryHandler(UserManager<User> userManager, ITokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDto> Handle(LoginQuery request, CancellationToken cancellationToken)
    {
        User? user = null;

        
        if (request.UsernameOrEmail.Contains("@"))
        {
            user = await _userManager.FindByEmailAsync(request.UsernameOrEmail);
        }
        else
        {
            user = await _userManager.FindByNameAsync(request.UsernameOrEmail);
        }

        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (!await _userManager.IsEmailConfirmedAsync(user))
            throw new UnauthorizedAccessException("Please confirm your email before logging in.");

        var token = _tokenService.GenerateToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _userManager.UpdateAsync(user);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken
        };
    }
}