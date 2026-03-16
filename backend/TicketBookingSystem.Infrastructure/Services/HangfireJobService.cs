using Hangfire;
using System;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class HangfireJobService : IJobService
{
    public string ScheduleSeatRelease(int seatId, TimeSpan delay)
    {
        return BackgroundJob.Schedule<ISeatReleaseService>(
            service => service.ReleaseSeatIfExpired(seatId),
            delay);
    }

    public bool CancelJob(string jobId)
    {
        if (string.IsNullOrEmpty(jobId)) return false;
        return BackgroundJob.Delete(jobId);
    }
}