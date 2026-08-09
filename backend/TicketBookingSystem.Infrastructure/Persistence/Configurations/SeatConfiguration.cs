using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence.Configurations;

public class SeatConfiguration : IEntityTypeConfiguration<Seat>
{
    public void Configure(EntityTypeBuilder<Seat> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Version).IsRowVersion();
        builder.Property(s => s.SeatNumber).IsRequired().HasMaxLength(50);
        builder.Property(s => s.Price).HasColumnType("decimal(18,2)");

        builder.HasOne(s => s.Event)
               .WithMany(e => e.Seats)
               .HasForeignKey(s => s.EventId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}