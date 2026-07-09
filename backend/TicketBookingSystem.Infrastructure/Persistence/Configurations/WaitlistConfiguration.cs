using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence.Configurations;

public class WaitlistConfiguration : IEntityTypeConfiguration<Waitlist>
{
    public void Configure(EntityTypeBuilder<Waitlist> builder)
    {
        builder.HasKey(w => w.Id);

        builder.Property(w => w.Email).IsRequired().HasMaxLength(150);

        builder.HasOne(w => w.Event)
               .WithMany()
               .HasForeignKey(w => w.EventId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.User)
               .WithMany()
               .HasForeignKey(w => w.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}