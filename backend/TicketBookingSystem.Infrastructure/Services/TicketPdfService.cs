using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class TicketPdfService : ITicketPdfService
{
    public Task<byte[]> GenerateTicketPdfAsync(string eventName, string venue, string date, string seatNumber, string username, string ticketId)
    {
        
        string qrContent = $"TICKET|{ticketId}|{username}|{seatNumber}";

        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(qrContent, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrCodeData);
        byte[] qrCodeImage = qrCode.GetGraphic(20);

        
        QuestPDF.Settings.License = LicenseType.Community;

        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5.Landscape());
                page.Margin(20);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(12).FontFamily(Fonts.Arial));

                page.Content().Row(row =>
                {
                    
                    row.RelativeItem(2).Background(Colors.Grey.Lighten4).Padding(20).Column(column =>
                    {
                        column.Item().Text("HUSSEIN STADIUM").FontSize(24).SemiBold().FontColor(Colors.Blue.Darken2);
                        column.Item().PaddingBottom(10).LineHorizontal(1).LineColor(Colors.Grey.Medium);

                        column.Item().Text("Event:").SemiBold().FontColor(Colors.Grey.Darken2);
                        
                        column.Item().PaddingBottom(10).Text(eventName).FontSize(18).Bold();

                        column.Item().Text("Venue & Date:").SemiBold().FontColor(Colors.Grey.Darken2);
                        
                        column.Item().PaddingBottom(10).Text($"{venue} | {date}");

                        column.Item().Text("Attendee:").SemiBold().FontColor(Colors.Grey.Darken2);
                        
                        column.Item().PaddingBottom(10).Text(username);

                        column.Item().Text("Seat Number:").SemiBold().FontColor(Colors.Grey.Darken2);
                        column.Item().Text(seatNumber).FontSize(20).Bold().FontColor(Colors.Red.Medium);
                    });

                    
                    row.RelativeItem(1).Background(Colors.White).Padding(10).Column(column =>
                    {
                        
                        column.Item().PaddingBottom(10).AlignCenter().Text("OFFICIAL TICKET").SemiBold().FontSize(14);
                        column.Item().AlignCenter().Image(qrCodeImage).FitArea();
                        
                        column.Item().PaddingTop(5).AlignCenter().Text($"ID: {ticketId}").FontSize(10).FontColor(Colors.Grey.Medium);
                    });
                });
            });
        });

        
        return Task.FromResult(document.GeneratePdf());
    }
}