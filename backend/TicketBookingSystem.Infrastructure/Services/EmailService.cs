using System.Net;
using System.Net.Mail;
using System.Net.Mime; 
using System.IO;       
using Microsoft.Extensions.Configuration;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    
    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var mailMessage = CreateMailMessage(toEmail, subject, body);
        await SendMailAsync(mailMessage);
    }

   
    public async Task SendEmailWithAttachmentAsync(string toEmail, string subject, string body, byte[] attachmentBytes, string attachmentName)
    {
        var mailMessage = CreateMailMessage(toEmail, subject, body);

       
        using var ms = new MemoryStream(attachmentBytes);
        var attachment = new Attachment(ms, attachmentName, MediaTypeNames.Application.Pdf);
        mailMessage.Attachments.Add(attachment);

        await SendMailAsync(mailMessage);
    }

    
    private MailMessage CreateMailMessage(string toEmail, string subject, string body)
    {
        var senderEmail = _config["EmailSettings:SenderEmail"];
        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail!, "Hussein Stadium Tickets"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true,
        };
        mailMessage.To.Add(toEmail);
        return mailMessage;
    }

    
    private async Task SendMailAsync(MailMessage mailMessage)
    {
        var smtpServer = _config["EmailSettings:SmtpServer"];
        var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"]!);
        var smtpUsername = _config["EmailSettings:SmtpUsername"];
        var smtpPassword = _config["EmailSettings:SmtpPassword"];

        using var client = new SmtpClient(smtpServer, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUsername, smtpPassword),
            EnableSsl = true
        };

        await client.SendMailAsync(mailMessage);
    }
}