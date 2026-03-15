using System.Net;
using System.Net.Mail;
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
        var smtpServer = _config["EmailSettings:SmtpServer"];
        var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"]!);
        var smtpUsername = _config["EmailSettings:SmtpUsername"]; 
        var smtpPassword = _config["EmailSettings:SmtpPassword"]; 
        var senderEmail = _config["EmailSettings:SenderEmail"];

        using var client = new SmtpClient(smtpServer, smtpPort)
        {
            
            Credentials = new NetworkCredential(smtpUsername, smtpPassword),
            EnableSsl = true
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail!, "Hussein Stadium Tickets"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true,
        };

        mailMessage.To.Add(toEmail);

        await client.SendMailAsync(mailMessage);
    }
}