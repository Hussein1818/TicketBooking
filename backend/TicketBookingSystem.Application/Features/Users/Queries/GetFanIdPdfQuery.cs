using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Users.Queries;

public class GetFanIdPdfQuery : IRequest<byte[]>
{
    public string UserId { get; set; } = string.Empty;
}

public class GetFanIdPdfQueryHandler : IRequestHandler<GetFanIdPdfQuery, byte[]>
{
    private readonly IApplicationDbContext _context;
    private readonly IFanIdPdfService _fanIdPdfService;

    public GetFanIdPdfQueryHandler(IApplicationDbContext context, IFanIdPdfService fanIdPdfService)
    {
        _context = context;
        _fanIdPdfService = fanIdPdfService;
    }

    public async Task<byte[]> Handle(GetFanIdPdfQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null) throw new NotFoundException(nameof(Domain.Entities.User), request.UserId);

       
        if (string.IsNullOrEmpty(user.FanIdNumber) || string.IsNullOrEmpty(user.NationalId))
        {
            throw new BadRequestException("Please update your profile with National ID and Full Name first to generate a Fan ID.");
        }

       
        var pdfBytes = await _fanIdPdfService.GenerateFanIdPdfAsync(
            user.FullName,
            user.FanIdNumber,
            user.NationalId,
            user.ProfilePictureUrl);

        return pdfBytes;
    }
}