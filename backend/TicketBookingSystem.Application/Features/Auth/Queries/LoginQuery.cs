using TicketBookingSystem.Application.DTOs.Auth;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Auth.Queries;

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

        if (request.UsernameOrEmail.Contains('@'))
        {
            user = await _userManager.FindByEmailAsync(request.UsernameOrEmail);
        }
        else
        {
            user = await _userManager.FindByNameAsync(request.UsernameOrEmail);
        }

        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            throw new BadRequestException("Invalid credentials.");

        if (!await _userManager.IsEmailConfirmedAsync(user))
            throw new BadRequestException("Please confirm your email before logging in.");

        var roles = await _userManager.GetRolesAsync(user);

        var token = _tokenService.GenerateToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Username = user.UserName ?? string.Empty,
            Roles = roles
        };
    }
}