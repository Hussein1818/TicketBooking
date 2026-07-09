using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Admin;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Admin.Queries;

public class GetAllUsersQuery : IRequest<List<UserAdminDto>> { }

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, List<UserAdminDto>>
{
    private readonly UserManager<User> _userManager;

    public GetAllUsersQueryHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    public async Task<List<UserAdminDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userManager.Users.AsNoTracking().ToListAsync(cancellationToken);
        var userDtos = new List<UserAdminDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new UserAdminDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Role = roles.FirstOrDefault() ?? "Customer",
                FanIdNumber = user.FanIdNumber
            });
        }

        return userDtos;
    }
}