using Microsoft.AspNetCore.Hosting;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly IWebHostEnvironment _env;

    // SEC-08: Magic bytes for known image formats (defense-in-depth)
    private static readonly Dictionary<string, byte[][]> ImageMagicBytes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg",  new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
        { ".png",  new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } },
        { ".webp", new[] { new byte[] { 0x52, 0x49, 0x46, 0x46 } } } // RIFF header
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    public FileService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> UploadProfilePictureAsync(Stream fileStream, string extension, string userId)
    {
        if (fileStream == null || fileStream.Length == 0) return string.Empty;

        // SEC-08: Validate extension whitelist (defense-in-depth, also validated at controller)
        if (!AllowedExtensions.Contains(extension))
            throw new InvalidOperationException($"File extension '{extension}' is not allowed.");

        // SEC-08: Validate magic bytes to ensure the file content matches the claimed extension
        fileStream.Position = 0;
        if (!await ValidateMagicBytesAsync(fileStream, extension))
            throw new InvalidOperationException("File content does not match the expected image format.");

        fileStream.Position = 0;

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "Uploads", "Profiles");

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // SEC-08: Use a random filename to prevent user ID enumeration and path traversal
        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var destStream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destStream);
        }

        return $"/Uploads/Profiles/{uniqueFileName}";
    }

    /// <summary>
    /// Validates that the first bytes of the file match the expected magic bytes for the given extension.
    /// This prevents attacks where a malicious file is renamed with an image extension.
    /// </summary>
    private static async Task<bool> ValidateMagicBytesAsync(Stream fileStream, string extension)
    {
        if (!ImageMagicBytes.TryGetValue(extension, out var signatures))
            return false;

        var maxLength = signatures.Max(s => s.Length);
        var headerBytes = new byte[maxLength];
        var bytesRead = await fileStream.ReadAsync(headerBytes, 0, maxLength);

        if (bytesRead < signatures.Min(s => s.Length))
            return false;

        return signatures.Any(signature =>
            headerBytes.Take(signature.Length).SequenceEqual(signature));
    }
}