using Hangfire.Dashboard;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Api.Middlewares;

public class HangfireAdminAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        if (httpContext.User?.Identity?.IsAuthenticated != true)
            return false;

        return httpContext.User.IsInRole(Roles.Admin);
    }
}