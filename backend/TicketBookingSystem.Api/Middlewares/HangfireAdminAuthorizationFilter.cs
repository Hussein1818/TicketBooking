using Hangfire.Dashboard;

namespace TicketBookingSystem.Api.Middlewares;

/// <summary>
/// Authorization filter for the Hangfire Dashboard.
/// Only allows access to authenticated users with the Admin role.
/// </summary>
public class HangfireAdminAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Must be authenticated
        if (httpContext.User?.Identity?.IsAuthenticated != true)
            return false;

        // Must be in the Admin role
        return httpContext.User.IsInRole("Admin");
    }
}
