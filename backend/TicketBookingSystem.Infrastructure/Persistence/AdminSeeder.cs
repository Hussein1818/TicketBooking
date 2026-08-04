using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using TicketBookingSystem.Domain.Constants;
using TicketBookingSystem.Domain.Entities;

namespace TicketBookingSystem.Infrastructure.Persistence;

public static class AdminSeeder
{
    public static async Task SeedAdminsAsync(UserManager<User> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
    {
        string[] roleNames = { Roles.Admin, Roles.Customer, Roles.Organizer, Roles.Staff };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        await EnsureAdminUser(userManager, "sehs_rm", "sehs9556@gmail.com", "Hussein (Super Admin)", configuration["AdminPasswords:Hussein"]);
        await EnsureAdminUser(userManager, "osama_21", "osama11111777@gmail.com", "Osama (Admin)", configuration["AdminPasswords:Osama"]);
    }

    private static async Task EnsureAdminUser(UserManager<User> userManager, string username, string email, string fullName, string? password)
    {
        if (string.IsNullOrEmpty(password)) return;

        var user = await userManager.FindByNameAsync(username);

        if (user == null)
        {
            user = new User
            {
                UserName = username,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded) return;
        }

        if (!await userManager.IsInRoleAsync(user, Roles.Admin))
        {
            await userManager.AddToRoleAsync(user, Roles.Admin);
        }
    }
}