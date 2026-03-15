using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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

    public async Task<string> UploadProfilePictureAsync(IFormFile file, string userId)
    {
        if (file == null || file.Length == 0) return string.Empty;

        
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "Uploads", "Profiles");

        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var fileExtension = Path.GetExtension(file.FileName);
        var uniqueFileName = $"Profile_{userId}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        return $"/Uploads/Profiles/{uniqueFileName}";
    }
}