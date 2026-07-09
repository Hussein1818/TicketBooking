using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.AmountPaid).HasColumnType("decimal(18,2)");
        builder.Property(b => b.ExchangeRate).HasColumnType("decimal(18,4)");
        builder.Property(b => b.PlatformFee).HasColumnType("decimal(18,2)");
        builder.Property(b => b.OrganizerEarnings).HasColumnType("decimal(18,2)");
        builder.Property(b => b.Currency).HasMaxLength(10);

        builder.HasOne(b => b.Seat)
               .WithMany()
               .HasForeignKey(b => b.SeatId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.User)
               .WithMany()
               .HasForeignKey(b => b.UserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Order)
               .WithMany(o => o.Bookings)
               .HasForeignKey(b => b.OrderId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}