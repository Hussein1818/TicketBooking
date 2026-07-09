using Hangfire;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Admin.Commands;

public class BlastCampaignCommand : IRequest<int>
{
    public int EventId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string CurrentUserId { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

public class BlastCampaignCommandHandler : IRequestHandler<BlastCampaignCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketHubService _hubService;

    public BlastCampaignCommandHandler(IApplicationDbContext context, ITicketHubService hubService)
    {
        _context = context;
        _hubService = hubService;
    }

    public async Task<int> Handle(BlastCampaignCommand request, CancellationToken ct)
    {
        var eventEntity = await _context.Events.FirstOrDefaultAsync(e => e.Id == request.EventId, ct);
        if (eventEntity == null)
            throw new TicketBookingSystem.Application.Exceptions.NotFoundException(nameof(Event), request.EventId);

        if (!request.IsAdmin && eventEntity.OrganizerId != request.CurrentUserId)
            throw new UnauthorizedAccessException("You don't have permission to launch a campaign for this event.");

        var attendees = await _context.Bookings
            .Include(b => b.User)
            .Where(b => b.Seat.EventId == request.EventId && b.Seat.Status == SeatStatus.Booked)
            .Select(b => new { Username = b.UserId, Email = b.User.Email })
            .Distinct()
            .ToListAsync(ct);

        if (!attendees.Any()) return 0;

        var notifications = new List<Notification>();

        foreach (var attendee in attendees)
        {
            notifications.Add(new Notification
            {
                UserId = attendee.Username,
                Message = request.Message,
                Type = "BlastCampaign",
                CreatedAt = DateTime.UtcNow
            });

            if (!string.IsNullOrEmpty(attendee.Email))
            {
                BackgroundJob.Enqueue<IEmailService>(emailService =>
                    emailService.SendEmailAsync(attendee.Email, request.Subject, request.Message));
            }
        }

        _context.Notifications.AddRange(notifications);

        _context.AuditLogs.Add(new AuditLog
        {
            Username = request.CurrentUserId,
            Action = "Blast Campaign",
            Details = $"Launched campaign '{request.Subject}' targeting {attendees.Count} attendees of Event ID {request.EventId}."
        });

        await _context.SaveChangesAsync(ct);

        foreach (var attendee in attendees)
        {
            await _hubService.SendUserNotification(attendee.Username, request.Message, "BlastCampaign");
        }

        return attendees.Count;
    }
}