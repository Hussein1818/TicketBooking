using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Application.Features.Bookings.Commands;

public class MockCheckoutCommand : IRequest<bool>
{
    public string UserId { get; set; } = string.Empty;
}

public class MockCheckoutCommandHandler : IRequestHandler<MockCheckoutCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IPricingService _pricingService;
    private readonly IJobService _jobService;
    private readonly ITicketHubService _hubService;

    public MockCheckoutCommandHandler(
        IApplicationDbContext context,
        IPricingService pricingService,
        IJobService jobService,
        ITicketHubService hubService)
    {
        _context = context;
        _pricingService = pricingService;
        _jobService = jobService;
        _hubService = hubService;
    }

    public async Task<bool> Handle(MockCheckoutCommand request, CancellationToken cancellationToken)
    {
        
        var bookings = await _context.Bookings
            .Include(b => b.Seat)
            .Where(b => b.UserId == request.UserId && b.Seat.Status == SeatStatus.Locked)
            .ToListAsync(cancellationToken);

        if (!bookings.Any()) return false;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.UserId, cancellationToken);
        if (user == null) return false;

        
        decimal totalBasePrice = bookings.Sum(b => b.Seat.Price);
        var pricing = await _pricingService.CalculateDiscountedPriceAsync(totalBasePrice, user, null, cancellationToken);

       
        var order = new Order
        {
            UserId = request.UserId,
            OrderDate = DateTime.UtcNow,
            TotalAmount = pricing.FinalPriceEgp,
            Currency = "EGP",
            Status = "Paid"
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

       
        int pointsToAward = (int)(pricing.FinalPriceEgp / 10);
        user.AddLoyaltyPoints(pointsToAward);
        _context.AuditLogs.Add(new AuditLog { Username = user.UserName!, Action = "Loyalty Points", Details = $"Earned {pointsToAward} points from Mock Checkout." });

        
        foreach (var booking in bookings)
        {
            if (pricing.OriginalPriceEgp > 0)
            {
                booking.AmountPaid = Math.Round((booking.Seat.Price / pricing.OriginalPriceEgp) * pricing.FinalPriceEgp, 2);
            }
            booking.Currency = "EGP";
            booking.ExchangeRate = 1m;
            booking.OrderId = order.Id;

            
            _pricingService.ApplyRevenueSplit(booking);
            booking.Seat.Status = SeatStatus.Booked;

            
            if (!string.IsNullOrEmpty(booking.JobId))
            {
                _jobService.CancelJob(booking.JobId);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        
        foreach (var booking in bookings)
        {
            await _hubService.SendSeatBookedNotification(booking.SeatId);
        }
        await _hubService.SendDashboardUpdate();

        return true;
    }
}