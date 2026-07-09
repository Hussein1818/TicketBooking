using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.DTOs.Bookings;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Queries;

public class GetUserTicketsQuery : IRequest<List<UserTicketDto>>
{
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
}

public class GetUserTicketsQueryHandler : IRequestHandler<GetUserTicketsQuery, List<UserTicketDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public GetUserTicketsQueryHandler(IApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<List<UserTicketDto>> Handle(GetUserTicketsQuery request, CancellationToken cancellationToken)
    {
        var authenticatedUser = request.UserId;
        if (string.IsNullOrEmpty(authenticatedUser)) return new List<UserTicketDto>();

        var bookings = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.Seat)
            .ThenInclude(s => s.Event)
            .Where(b => b.UserId == authenticatedUser && b.Seat.Status == SeatStatus.Booked)
            .OrderByDescending(b => b.Id)
            .ToListAsync(cancellationToken);

        var secretKey = _configuration["QrCode:HmacKey"]
            ?? throw new InvalidOperationException("QrCode:HmacKey is not configured.");
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