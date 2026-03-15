using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Application.Features.Users.Commands;

public class UpdateUserProfileCommand : IRequest<bool>
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;

    
    public IFormFile? ProfilePicture { get; set; }
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

        
        if (request.ProfilePicture != null && request.ProfilePicture.Length > 0)
        {
            var pictureUrl = await _fileService.UploadProfilePictureAsync(request.ProfilePicture, request.UserId);
            user.ProfilePictureUrl = pictureUrl;
        }

        
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}