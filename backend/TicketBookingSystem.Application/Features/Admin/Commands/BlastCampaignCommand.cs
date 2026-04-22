using FluentValidation;
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

    // Security Fields
    public string CurrentUserId { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
}

public class BlastCampaignCommandValidator : AbstractValidator<BlastCampaignCommand>
{
    public BlastCampaignCommandValidator()
    {
        RuleFor(v => v.EventId).GreaterThan(0).WithMessage("Event ID must be greater than 0.");
        RuleFor(v => v.Subject).NotEmpty().MaximumLength(150).WithMessage("Subject is required and cannot exceed 150 characters.");
        RuleFor(v => v.Message).NotEmpty().MaximumLength(1000).WithMessage("Message is required and cannot exceed 1000 characters.");
    }
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

        //  Only Admin or the Event Organizer can send campaigns for this event
        if (!request.IsAdmin && eventEntity.OrganizerId != request.CurrentUserId)
            throw new UnauthorizedAccessException("You don't have permission to launch a campaign for this event.");

        // Fetch distinct users who have a booked seat for this event
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
            // 1. Prepare In-App Notification 
            notifications.Add(new Notification
            {
                UserId = attendee.Username, // System uses UserName as UserId for Notifications
                Message = request.Message,
                Type = "BlastCampaign",
                CreatedAt = DateTime.UtcNow
            });

            // 2. Queue Email to be sent in the background (Fire-and-forget so API responds instantly)
            if (!string.IsNullOrEmpty(attendee.Email))
            {
                BackgroundJob.Enqueue<IEmailService>(emailService =>
                    emailService.SendEmailAsync(attendee.Email, request.Subject, request.Message));
            }
        }

        _context.Notifications.AddRange(notifications);

        // Audit Tracking
        _context.AuditLogs.Add(new AuditLog
        {
            Username = request.CurrentUserId,
            Action = "Blast Campaign",
            Details = $"Launched campaign '{request.Subject}' targeting {attendees.Count} attendees of Event ID {request.EventId}."
        });

        await _context.SaveChangesAsync(ct);

        // 3. Fire Real-time SignalR Notifications......
        foreach (var attendee in attendees)
        {
            await _hubService.SendUserNotification(attendee.Username, request.Message, "BlastCampaign");
        }

        return attendees.Count;
    }
}