using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Distributed;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
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

    
    public IFormFile? CoverImage { get; set; }

    public int FullRefundDays { get; set; } = 7;
    public int PartialRefundDays { get; set; } = 3;
    public decimal PartialRefundPercentage { get; set; } = 50;
    public string CurrentUserId { get; set; } = string.Empty;
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
            await request.CoverImage.CopyToAsync(stream);
            
            imageUrl = await _fileService.UploadProfilePictureAsync(stream, extension, $"Event_{Guid.NewGuid():N}");
        }

        Event eventEntity;
        if (request.Id > 0)
        {
            eventEntity = await _context.Events.FindAsync(new object[] { request.Id }, cancellationToken);
            if (eventEntity == null) throw new TicketBookingSystem.Application.Exceptions.NotFoundException(nameof(Event), request.Id);

            if (!request.IsAdmin && eventEntity.OrganizerId != request.CurrentUserId)
                throw new UnauthorizedAccessException("You don't have permission to modify this event.");

            eventEntity.UpdateDetails(request.Name, request.EventDate, request.Venue, request.IsClosed, request.MaxTicketsPerUser, request.Category, imageUrl, request.FullRefundDays, request.PartialRefundDays, request.PartialRefundPercentage);
        }
        else
        {
            eventEntity = new Event(request.Name, request.EventDate, request.Venue, request.MaxTicketsPerUser, request.Category, request.CurrentUserId, imageUrl, request.FullRefundDays, request.PartialRefundDays, request.PartialRefundPercentage);
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