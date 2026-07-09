using System.Threading.Tasks;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Constants;

namespace TicketBookingSystem.Infrastructure.Services;

public class CurrencyConverterService : ICurrencyConverterService
{
    public Task<decimal> GetExchangeRateAsync(string fromCurrency, string toCurrency)
    {
        if (fromCurrency == toCurrency)
            return Task.FromResult(1.0m);

        if (fromCurrency == AppConstants.DefaultCurrency && toCurrency == "USD") return Task.FromResult(0.02m);
        if (fromCurrency == AppConstants.DefaultCurrency && toCurrency == "SAR") return Task.FromResult(0.075m);

        if (fromCurrency == "USD" && toCurrency == AppConstants.DefaultCurrency) return Task.FromResult(50.0m);
        if (fromCurrency == "SAR" && toCurrency == AppConstants.DefaultCurrency) return Task.FromResult(13.3m);

        return Task.FromResult(1.0m);
    }
}