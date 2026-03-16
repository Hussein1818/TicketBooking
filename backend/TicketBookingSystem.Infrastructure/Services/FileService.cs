using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly IWebHostEnvironment _env;

    public FileService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> UploadProfilePictureAsync(Stream fileStream, string extension, string userId)
    {
        if (fileStream == null || fileStream.Length == 0) return string.Empty;

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "Uploads", "Profiles");

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"Profile_{userId}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var destStream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destStream);
        }

        return $"/Uploads/Profiles/{uniqueFileName}";
    }
}