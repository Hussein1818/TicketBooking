using System.Threading.Tasks;

namespace TicketBookingSystem.Application.Interfaces;

public interface ICurrencyConverterService
{
    Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency);
}