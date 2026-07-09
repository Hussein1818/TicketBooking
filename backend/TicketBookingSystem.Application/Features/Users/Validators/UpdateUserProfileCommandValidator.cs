using FluentValidation;
using System.IO;
using System.Linq;
using TicketBookingSystem.Application.Features.Users.Commands;
using TicketBookingSystem.Application.Features.Users.Queries;

namespace TicketBookingSystem.Application.Features.Users.Validators;

public class UpdateUserProfileCommandValidator : AbstractValidator<UpdateUserProfileCommand>
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private const long MaxFileSize = 2 * 1024 * 1024; 

    public UpdateUserProfileCommandValidator()
    {
        RuleFor(v => v.FullName)
            .MaximumLength(100).WithMessage("Full Name must not exceed 100 characters.");

        RuleFor(v => v.NationalId)
            .Matches("^[0-9]{14}$").WithMessage("National ID must be exactly 14 digits.")
            .When(v => !string.IsNullOrEmpty(v.NationalId));

        RuleFor(v => v.PhoneNumber)
            .MaximumLength(15).WithMessage("Phone number must not exceed 15 characters.");

        RuleFor(v => v.ProfilePicture)
            .Must(file => file == null || file.Length <= MaxFileSize)
            .WithMessage("Profile picture size must not exceed 2 MB.")
            .Must(file => file == null || AllowedExtensions.Contains(Path.GetExtension(file.FileName).ToLower()))
            .WithMessage($"Invalid file type. Allowed types: {string.Join(", ", AllowedExtensions)}");
    }
}
