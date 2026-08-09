using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Admin;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Admin.Queries;

public class GetSystemLogsQuery : IRequest<PagedResult<AuditLogDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetSystemLogsHandler : IRequestHandler<GetSystemLogsQuery, PagedResult<AuditLogDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSystemLogsHandler(IApplicationDbContext context) => _context = context;

    public async Task<PagedResult<AuditLogDto>> Handle(GetSystemLogsQuery request, CancellationToken ct)
    {
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, 100);

        var query = _context.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.Timestamp);

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Username = a.Username,
                Action = a.Action,
                Details = a.Details,
                Timestamp = a.Timestamp
            })
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}