using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Venue).IsRequired().HasMaxLength(300);
        builder.Property(e => e.Category).HasMaxLength(50);
        builder.Property(e => e.TicketPrice).HasColumnType("decimal(18,2)");
        builder.Property(e => e.PartialRefundPercentage).HasColumnType("decimal(5,2)");

        builder.HasOne(e => e.Organizer)
               .WithMany()
               .HasForeignKey(e => e.OrganizerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}