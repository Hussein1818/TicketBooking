using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Bookings.Queries;

public class GetUserTicketsQuery : IRequest<List<UserTicketDto>>
{
    public string UserId { get; set; } = string.Empty;
}

public class UserTicketDto
{
    public int BookingId { get; set; }
    public int SeatId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public decimal AmountPaid { get; set; }
    public string QrData { get; set; } = string.Empty;
}

public class GetUserTicketsQueryHandler : IRequestHandler<GetUserTicketsQuery, List<UserTicketDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IConfiguration _configuration;

    public GetUserTicketsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUserService, IConfiguration configuration)
    {
        _context = context;
        _currentUserService = currentUserService;
        _configuration = configuration;
    }

    public async Task<List<UserTicketDto>> Handle(GetUserTicketsQuery request, CancellationToken cancellationToken)
    {
        var authenticatedUser = _currentUserService.Username;
        if (string.IsNullOrEmpty(authenticatedUser)) return new List<UserTicketDto>();

        var bookings = await _context.Bookings
            .Include(b => b.Seat)
            .ThenInclude(s => s.Event)
            .Where(b => b.UserId == authenticatedUser && b.Seat.Status == SeatStatus.Booked)
            .OrderByDescending(b => b.Id)
            .ToListAsync(cancellationToken);

        var secretKey = _configuration["Jwt:Key"] ?? string.Empty;
        var dtos = new List<UserTicketDto>();

        foreach (var b in bookings)
        {
            var rawData = $"TICKET|{b.SeatId}|{b.UserId.ToLower()}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawData)));

            dtos.Add(new UserTicketDto
            {
                BookingId = b.Id,
                SeatId = b.SeatId,
                SeatNumber = b.Seat.SeatNumber,
                EventName = b.Seat.Event.Name,
                EventDate = b.Seat.Event.EventDate,
                AmountPaid = b.AmountPaid,
                QrData = $"{rawData}|{signature}"
            });
        }

        return dtos;
    }
}