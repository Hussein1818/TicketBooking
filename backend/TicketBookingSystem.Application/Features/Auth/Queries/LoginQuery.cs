using MediatR;
using Microsoft.AspNetCore.Identity;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Auth.Queries;

public class LoginQuery : IRequest<string>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginQueryHandler : IRequestHandler<LoginQuery, string>
{
    private readonly UserManager<User> _userManager;
    private readonly ITokenService _tokenService;

    public LoginQueryHandler(UserManager<User> userManager, ITokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    public async Task<string> Handle(LoginQuery request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null)
            throw new UnauthorizedAccessException("Invalid credentials.");

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            throw new UnauthorizedAccessException("Invalid credentials.");

        return _tokenService.GenerateToken(user);
    }
}