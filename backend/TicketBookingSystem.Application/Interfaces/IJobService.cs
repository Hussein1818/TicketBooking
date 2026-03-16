using System;

namespace TicketBookingSystem.Application.Interfaces;

public interface IJobService
{
    string ScheduleSeatRelease(int seatId, TimeSpan delay);
    bool CancelJob(string jobId);
}