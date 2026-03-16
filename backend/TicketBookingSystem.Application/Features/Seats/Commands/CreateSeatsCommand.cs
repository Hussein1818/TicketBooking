using MediatR;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Features.Seats.Commands;

public class CreateSeatsCommand : IRequest<int>
{
    public int EventId { get; set; }
    public int RegularSeatsCount { get; set; }
    public int VipSeatsCount { get; set; }
    public decimal PricePerSeat { get; set; }
}

public class CreateSeatsCommandHandler : IRequestHandler<CreateSeatsCommand, int>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public CreateSeatsCommandHandler(IApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<int> Handle(CreateSeatsCommand request, CancellationToken cancellationToken)
    {
        var ev = await _context.Events.FirstOrDefaultAsync(e => e.Id == request.EventId, cancellationToken);

        if (ev == null)
        {
            throw new TicketBookingSystem.Application.Exceptions.NotFoundException(nameof(Event), request.EventId);
        }

        var currentSeatsCount = await _context.Seats.CountAsync(s => s.EventId == request.EventId, cancellationToken);
        var seats = new List<Seat>();

        for (int i = 1; i <= request.VipSeatsCount; i++)
        {
            currentSeatsCount++;
            seats.Add(new Seat
            {
                EventId = request.EventId,
                SeatNumber = $"VIP-{ev.Id}-{currentSeatsCount}",
                Price = request.PricePerSeat * 2,
                Status = SeatStatus.Available
            });
        }

        for (int i = 1; i <= request.RegularSeatsCount; i++)
        {
            currentSeatsCount++;
            seats.Add(new Seat
            {
                EventId = request.EventId,
                SeatNumber = $"REG-{ev.Id}-{currentSeatsCount}",
                Price = request.PricePerSeat,
                Status = SeatStatus.Available
            });
        }

        _context.Seats.AddRange(seats);
        await _context.SaveChangesAsync(cancellationToken);

        int totalNewSeats = request.RegularSeatsCount + request.VipSeatsCount;
        var waitlistUsers = await _context.Waitlists
            .Where(w => w.EventId == request.EventId)
            .OrderBy(w => w.Id)
            .Take(totalNewSeats)
            .ToListAsync(cancellationToken);

        if (waitlistUsers.Any())
        {
            var emailTasks = waitlistUsers.Select(w => _emailService.SendEmailAsync(
                w.Email,
                "Tickets Available!",
                $"Good news! New tickets just dropped for {ev.Name}. Hurry up and book your seat now before they are gone!"
            ));

            await Task.WhenAll(emailTasks);

            _context.Waitlists.RemoveRange(waitlistUsers);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return seats.Count;
    }
}