using System.IO;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface IFileService
{
    Task<string> UploadProfilePictureAsync(Stream fileStream, string extension, string userId);
}