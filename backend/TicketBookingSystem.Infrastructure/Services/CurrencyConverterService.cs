using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;

namespace TicketBookingSystem.Infrastructure.Services;

public class CurrencyConverterService : ICurrencyConverterService
{
    public Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return Task.FromResult(1.0m);

        if (fromCurrency == "EGP" && toCurrency == "USD") return Task.FromResult(0.02m);
        if (fromCurrency == "EGP" && toCurrency == "SAR") return Task.FromResult(0.075m);

        if (fromCurrency == "USD" && toCurrency == "EGP") return Task.FromResult(50.0m);
        if (fromCurrency == "SAR" && toCurrency == "EGP") return Task.FromResult(13.3m);

        return Task.FromResult(1.0m);
    }
}