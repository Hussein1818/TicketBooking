using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace TicketBookingSystem.Infrastructure.Persistence;

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile(Path.Combine(Directory.GetCurrentDirectory(), "../TicketBookingSystem.Api/appsettings.json"), optional: true)
            .Build();

        var builder = new DbContextOptionsBuilder<ApplicationDbContext>();

        
        var connectionString = configuration.GetConnectionString("DefaultConnection")
                               ?? "Server=.;Database=TicketBookingDB;Trusted_Connection=True;TrustServerCertificate=True;";

        builder.UseSqlServer(connectionString);

        return new ApplicationDbContext(builder.Options);
    }
}