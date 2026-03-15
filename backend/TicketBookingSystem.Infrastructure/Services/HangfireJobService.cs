using Hangfire;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class HangfireJobService : IJobService
{
    public void ScheduleSeatRelease(int seatId, TimeSpan delay)
    {
        BackgroundJob.Schedule<ISeatReleaseService>(
            service => service.ReleaseSeatIfExpired(seatId),
            delay);
    }
}