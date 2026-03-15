using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class FanIdPdfService : IFanIdPdfService
{
    private readonly IWebHostEnvironment _env;

    public FanIdPdfService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public Task<byte[]> GenerateFanIdPdfAsync(string fullName, string fanIdNumber, string nationalId, string profilePicPath)
    {
        
        string qrContent = $"FANID|{fanIdNumber}|{nationalId}";
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(qrContent, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrCodeData);
        byte[] qrCodeImage = qrCode.GetGraphic(20);

        
        byte[] profileImage = System.Array.Empty<byte>();
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        if (!string.IsNullOrEmpty(profilePicPath))
        {
            string cleanPath = profilePicPath.StartsWith("/") ? profilePicPath.Substring(1) : profilePicPath;
            string fullImagePath = Path.Combine(webRoot, cleanPath.Replace("/", Path.DirectorySeparatorChar.ToString()));

            if (File.Exists(fullImagePath))
            {
                profileImage = File.ReadAllBytes(fullImagePath);
            }
        }

        QuestPDF.Settings.License = LicenseType.Community;

        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A6.Portrait()); 
                page.Margin(15);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                page.Content().Column(column =>
                {
                    column.Item().Background(Colors.Blue.Darken2).Padding(10).AlignCenter()
                          .Text("HUSSEIN STADIUM - FAN ID").FontSize(14).Bold().FontColor(Colors.White);

                    column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    if (profileImage.Length > 0)
                    {
                        column.Item().Height(120).AlignCenter().Image(profileImage).FitArea();
                    }

                    column.Item().PaddingTop(15).AlignCenter().Text(fullName).FontSize(16).Bold().FontColor(Colors.Black);
                    column.Item().PaddingBottom(10).AlignCenter().Text($"FAN ID: {fanIdNumber}").FontSize(12).FontColor(Colors.Red.Medium);

                    column.Item().AlignCenter().Text($"NID: {nationalId}").FontSize(10).FontColor(Colors.Grey.Darken2);

                    column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    column.Item().Height(80).AlignCenter().Image(qrCodeImage).FitArea();
                });
            });
        });

        return Task.FromResult(document.GeneratePdf());
    }
}