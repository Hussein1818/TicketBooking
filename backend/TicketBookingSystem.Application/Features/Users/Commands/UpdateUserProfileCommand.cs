using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System;
using System.IO;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Users.Commands;

public class UpdateUserProfileCommand : IRequest<string>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public IFormFile? ProfilePicture { get; set; }
}

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, string>
{
    private readonly UserManager<User> _userManager;
    private readonly IFileService _fileService;

    public UpdateUserProfileCommandHandler(UserManager<User> userManager, IFileService fileService)
    {
        _userManager = userManager;
        _fileService = fileService;
    }

    public async Task<string> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null) throw new NotFoundException(nameof(User), request.UserId);

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName;

        if (!string.IsNullOrWhiteSpace(request.NationalId))
            user.NationalId = request.NationalId;

        if (!string.IsNullOrWhiteSpace(request.Address))
            user.Address = request.Address;

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber;

        if (string.IsNullOrEmpty(user.FanIdNumber))
        {
            user.FanIdNumber = $"FAN-{DateTime.UtcNow:yyMMdd}-{user.Id.Substring(0, 4).ToUpper()}";
        }

        string pictureUrl = user.ProfilePictureUrl;

        if (request.ProfilePicture != null && request.ProfilePicture.Length > 0)
        {
            var extension = Path.GetExtension(request.ProfilePicture.FileName);
            using var stream = new MemoryStream();
            await request.ProfilePicture.CopyToAsync(stream, cancellationToken);

            pictureUrl = await _fileService.UploadProfilePictureAsync(stream, extension, $"User_{user.Id}_{Guid.NewGuid():N}");
            user.ProfilePictureUrl = pictureUrl;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new BadRequestException("Failed to update profile details.");

        return pictureUrl;
    }
}