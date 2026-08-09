using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(u => u.Version).IsRowVersion();

        builder.Property(u => u.WalletBalance).HasColumnType("decimal(18,2)");
        builder.Property(u => u.FullName).HasMaxLength(100);
        builder.Property(u => u.NationalId).HasMaxLength(14);
        builder.Property(u => u.FanIdNumber).HasMaxLength(50);
    }
}