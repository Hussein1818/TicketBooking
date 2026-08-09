using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Bookings;
using TicketBookingSystem.Application.Exceptions;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Application.Features.Bookings.Queries;

public class DownloadTicketQuery : IRequest<TicketFileDto>
{
    public int BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
}

public class DownloadTicketQueryHandler : IRequestHandler<DownloadTicketQuery, TicketFileDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ITicketPdfService _pdfService;

    public DownloadTicketQueryHandler(IApplicationDbContext context, ITicketPdfService pdfService)
    {
        _context = context;
        _pdfService = pdfService;
    }

    public async Task<TicketFileDto> Handle(DownloadTicketQuery request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.Seat)
            .ThenInclude(s => s.Event)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == request.UserId, cancellationToken);

        if (booking == null)
            throw new NotFoundException(nameof(Booking), request.BookingId);

        var pdfBytes = await _pdfService.GenerateTicketPdfAsync(
            eventName: booking.Seat.Event.Name,
            venue: booking.Seat.Event.Venue,
            date: booking.Seat.Event.EventDate.ToString("f"),
            seatNumber: booking.Seat.SeatNumber,
            username: booking.UserId,
            seatId: booking.SeatId
        );

        return new TicketFileDto
        {
            FileData = pdfBytes,
            FileName = $"Ticket_{booking.Seat.SeatNumber}.pdf"
        };
    }
}