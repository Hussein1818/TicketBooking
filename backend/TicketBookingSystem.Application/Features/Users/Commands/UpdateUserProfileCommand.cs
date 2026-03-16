using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Users.Commands;

public class UpdateUserProfileCommand : IRequest<bool>
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public byte[]? ProfilePictureContent { get; set; }
    public string? ProfilePictureExtension { get; set; }
}

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IFileService _fileService;

    public UpdateUserProfileCommandHandler(IApplicationDbContext context, IFileService fileService)
    {
        _context = context;
        _fileService = fileService;
    }

    public async Task<bool> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null) throw new Exception("User not found");

        user.FullName = request.FullName;
        user.NationalId = request.NationalId;

        if (string.IsNullOrEmpty(user.FanIdNumber))
        {
            user.FanIdNumber = $"FAN-{DateTime.UtcNow:yyMMdd}-{user.Id.Substring(0, 4).ToUpper()}";
        }

        if (request.ProfilePictureContent != null && request.ProfilePictureContent.Length > 0 && !string.IsNullOrEmpty(request.ProfilePictureExtension))
        {
            using var stream = new MemoryStream(request.ProfilePictureContent);
            var pictureUrl = await _fileService.UploadProfilePictureAsync(stream, request.ProfilePictureExtension, request.UserId);
            user.ProfilePictureUrl = pictureUrl;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}