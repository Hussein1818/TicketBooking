using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface IFileService
{
    Task<string> UploadProfilePictureAsync(IFormFile file, string userId);
}