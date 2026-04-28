using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Admin.Queries;

public class GetAllUsersQuery : IRequest<List<UserAdminDto>> { }

public class UserAdminDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string FanIdNumber { get; set; } = string.Empty;
}

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, List<UserAdminDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAllUsersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserAdminDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Users
            .AsNoTracking()
            .Select(u => new UserAdminDto
            {
                Id = u.Id,
                Username = u.UserName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                FullName = u.FullName,
                Role = u.Role.ToString(),
                FanIdNumber = u.FanIdNumber
            })
            .ToListAsync(cancellationToken);
    }
}