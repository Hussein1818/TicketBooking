using System;
using System.Threading;
using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}