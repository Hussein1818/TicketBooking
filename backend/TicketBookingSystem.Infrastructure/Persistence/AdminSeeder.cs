using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Domain.Enums;

namespace TicketBookingSystem.Infrastructure.Persistence;

public static class AdminSeeder
{
    public static async Task SeedAdminsAsync(UserManager<User> userManager, IConfiguration configuration)
    {
        if (!await userManager.Users.AnyAsync(u => u.Role == UserRole.Admin))
        {
            
            var husseinPassword = configuration["AdminPasswords:Hussein"];
            var osamaPassword = configuration["AdminPasswords:Osama"];

            if (string.IsNullOrEmpty(husseinPassword) || string.IsNullOrEmpty(osamaPassword))
                return; 

            var hussein = new User
            {
                UserName = "sehs_rm",
                Email = "sehs9556@gmail.com",
                FullName = "Hussein (Super Admin)",
                Role = UserRole.Admin,
                EmailConfirmed = true
            };
            await userManager.CreateAsync(hussein, husseinPassword);

            var osama = new User
            {
                UserName = "osama_21",
                Email = "osama11111777@gmail.com",
                FullName = "Osama (Admin)",
                Role = UserRole.Admin,
                EmailConfirmed = true
            };
            await userManager.CreateAsync(osama, osamaPassword);
        }
    }
}