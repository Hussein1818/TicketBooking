using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<User>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Event> Events { get; set; }
    public DbSet<Seat> Seats { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<PromoCode> PromoCodes { get; set; }
    public DbSet<Waitlist> Waitlists { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    public DbSet<Order> Orders { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Seat>()
            .Property(s => s.Version)
            .IsRowVersion();

        modelBuilder.Entity<User>()
            .Property(u => u.Version)
            .IsRowVersion();

        modelBuilder.Entity<Seat>()
            .HasOne(s => s.Event)
            .WithMany(e => e.Seats)
            .HasForeignKey(s => s.EventId);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Seat)
            .WithMany()
            .HasForeignKey(b => b.SeatId);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId);

        modelBuilder.Entity<Event>()
            .HasOne(e => e.Organizer)
            .WithMany()
            .HasForeignKey(e => e.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);

    }
}