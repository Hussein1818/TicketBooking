using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.IO;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Events.Commands;

public class ManageEventCommand : IRequest<int>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Venue { get; set; } = string.Empty;
    public bool IsClosed { get; set; }
    public int MaxTicketsPerUser { get; set; }
    public string Category { get; set; } = "General";

    public decimal TicketPrice { get; set; } = 0;
    public int RegularSeatsCount { get; set; }
    public int VipSeatsCount { get; set; }
    public decimal VipTicketPrice { get; set; }

    public IFormFile? CoverImage { get; set; }

    public int FullRefundDays { get; set; } = 7;
    public int PartialRefundDays { get; set; } = 3;
    public decimal PartialRefundPercentage { get; set; } = 50;

    [JsonIgnore]
    public string CurrentUserId { get; set; } = string.Empty;

    [JsonIgnore]
    public bool IsAdmin { get; set; }
}

public class ManageEventCommandHandler : IRequestHandler<ManageEventCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly IFileService _fileService;

    public ManageEventCommandHandler(IApplicationDbContext context, IDistributedCache cache, IFileService fileService)
    {
        _context = context;
        _cache = cache;
        _fileService = fileService;
    }

    public async Task<int> Handle(ManageEventCommand request, CancellationToken cancellationToken)
    {
        string imageUrl = string.Empty;

        if (request.CoverImage != null && request.CoverImage.Length > 0)
        {
            var extension = Path.GetExtension(request.CoverImage.FileName);
            using var stream = new MemoryStream();
            await request.CoverImage.CopyToAsync(stream, cancellationToken);

            imageUrl = await _fileService.UploadProfilePictureAsync(stream, extension, $"Event_{Guid.NewGuid():N}");
        }

        Event? eventEntity;

        if (request.Id > 0)
        {
            eventEntity = await _context.Events.FindAsync(new object[] { request.Id }, cancellationToken);
            if (eventEntity == null)
                throw new NotFoundException(nameof(Event), request.Id);

            if (!request.IsAdmin && eventEntity.OrganizerId != request.CurrentUserId)
                throw new UnauthorizedAccessException("You don't have permission to modify this event.");

            eventEntity.UpdateDetails(request.Name, request.EventDate, request.Venue, request.IsClosed, request.MaxTicketsPerUser, request.Category, string.IsNullOrEmpty(imageUrl) ? eventEntity.ImageUrl : imageUrl, request.TicketPrice, request.FullRefundDays, request.PartialRefundDays, request.PartialRefundPercentage);
        }
        else
        {
            eventEntity = new Event(request.Name, request.EventDate, request.Venue, request.MaxTicketsPerUser, request.Category, request.CurrentUserId, string.IsNullOrEmpty(imageUrl) ? "" : imageUrl, request.TicketPrice, request.FullRefundDays, request.PartialRefundDays, request.PartialRefundPercentage);

            for (int i = 1; i <= request.RegularSeatsCount; i++)
            {
                eventEntity.AddSeat($"{AppConstants.SeatPrefixes.Regular}-{i}", request.TicketPrice);
            }

            for (int i = 1; i <= request.VipSeatsCount; i++)
            {
                eventEntity.AddSeat($"{AppConstants.SeatPrefixes.VIP}-{i}", request.VipTicketPrice);
            }

            _context.Events.Add(eventEntity);
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _cache.RemoveAsync("Events_List", cancellationToken);
        if (request.Id > 0)
        {
            await _cache.RemoveAsync($"Seats_Event_{request.Id}", cancellationToken);
        }

        return eventEntity.Id;
    }
}