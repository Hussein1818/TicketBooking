using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Event> Events { get; }
    DbSet<Seat> Seats { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<User> Users { get; }
    DbSet<PromoCode> PromoCodes { get; }
    DbSet<Waitlist> Waitlists { get; }
    DbSet<Review> Reviews { get; set; }
    DbSet<AuditLog> AuditLogs { get; set; }
    DbSet<Order> Orders { get; set; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}