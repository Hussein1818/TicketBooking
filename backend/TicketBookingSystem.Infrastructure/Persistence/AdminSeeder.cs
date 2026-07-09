using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System.Linq;
using System.Threading.Tasks;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence;

public static class AdminSeeder
{
    public static async Task SeedAdminsAsync(UserManager<User> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
    {
        // Ensure Roles exist first
        string[] roleNames = { Roles.Admin, Roles.Customer, Roles.Organizer, Roles.Staff };
        foreach (var roleName in roleNames)
        {
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        var admins = await userManager.GetUsersInRoleAsync(Roles.Admin);
        if (!admins.Any())
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
                EmailConfirmed = true
            };
            var result1 = await userManager.CreateAsync(hussein, husseinPassword);
            if (result1.Succeeded) await userManager.AddToRoleAsync(hussein, Roles.Admin);

            var osama = new User
            {
                UserName = "osama_21",
                Email = "osama11111777@gmail.com",
                FullName = "Osama (Admin)",
                EmailConfirmed = true
            };
            var result2 = await userManager.CreateAsync(osama, osamaPassword);
            if (result2.Succeeded) await userManager.AddToRoleAsync(osama, Roles.Admin);
        }
    }
}