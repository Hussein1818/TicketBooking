using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using TicketBookingSystem.Application.Interfaces;
using System.Threading.Tasks;

namespace TicketBookingSystem.Infrastructure.Services;

public class PaymobPaymentService : IPaymentService
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ICurrentUserService _currentUserService;

    public PaymobPaymentService(IConfiguration configuration, HttpClient httpClient, ICurrentUserService currentUserService)
    {
        _configuration = configuration;
        _httpClient = httpClient;
        _currentUserService = currentUserService;
    }

    public async Task<string> GetPaymentUrlAsync(int bookingId, decimal amount, string currency = "EGP")
    {
        var apiKey = _configuration["Paymob:ApiKey"];
        var integrationId = _configuration["Paymob:IntegrationId"];
        var iframeId = _configuration["Paymob:IframeId"];

        if (apiKey == "YOUR_API_KEY" || string.IsNullOrEmpty(apiKey) || apiKey.StartsWith("YOUR"))
        {
            return $"https://localhost:7203/api/Bookings/callback?success=true&merchant_order_id={bookingId}";
        }

        var authResponse = await _httpClient.PostAsJsonAsync("https://accept.paymob.com/api/auth/tokens", new { api_key = apiKey });
        var authResult = await authResponse.Content.ReadFromJsonAsync<PaymobAuthResponse>();
        var token = authResult!.Token;

        var amountCents = (int)(amount * 100);
        var orderResponse = await _httpClient.PostAsJsonAsync("https://accept.paymob.com/api/ecommerce/orders", new
        {
            auth_token = token,
            delivery_needed = "false",
            amount_cents = amountCents.ToString(),
            currency = currency,
            items = new object[] { }
        });
        var orderResult = await orderResponse.Content.ReadFromJsonAsync<PaymobOrderResponse>();
        var orderId = orderResult!.Id.ToString();

        var username = _currentUserService.Username ?? "Customer";
        var email = _currentUserService.Email ?? "customer@ticketbooking.com";

        var paymentKeyResponse = await _httpClient.PostAsJsonAsync("https://accept.paymob.com/api/acceptance/payment_keys", new
        {
            auth_token = token,
            amount_cents = amountCents.ToString(),
            expiration = 3600,
            order_id = orderId,
            billing_data = new
            {
                apartment = "NA",
                email = email,
                floor = "NA",
                first_name = username,
                street = "NA",
                building = "NA",
                phone_number = "+201000000000",
                shipping_method = "NA",
                postal_code = "NA",
                city = "Cairo",
                country = "EG",
                last_name = "User",
                state = "NA"
            },
            currency = currency,
            integration_id = int.Parse(integrationId!)
        });
        var paymentKeyResult = await paymentKeyResponse.Content.ReadFromJsonAsync<PaymobPaymentKeyResponse>();
        var paymentToken = paymentKeyResult!.Token;

        return $"https://accept.paymob.com/api/acceptance/iframes/{iframeId}?payment_token={paymentToken}";
    }

    private class PaymobAuthResponse { public string Token { get; set; } = string.Empty; }
    private class PaymobOrderResponse { public int Id { get; set; } }
    private class PaymobPaymentKeyResponse { public string Token { get; set; } = string.Empty; }
}