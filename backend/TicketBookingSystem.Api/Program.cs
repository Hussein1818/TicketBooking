using FluentValidation;
using Hangfire;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TicketBookingSystem.Api.Middlewares;
using TicketBookingSystem.Application.Features.Behaviors;
using TicketBookingSystem.Application.Interfaces;
using TicketBookingSystem.Domain.Entities;
using TicketBookingSystem.Infrastructure.Hubs;
using TicketBookingSystem.Infrastructure.Persistence;
using TicketBookingSystem.Infrastructure.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            // Development fallback: allow localhost origins
            policy.SetIsOriginAllowed(origin =>
                    new Uri(origin).Host == "localhost")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
        };

        
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/ticketHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("BookingPolicy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 5;
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddHangfireServer();
builder.Services.AddScoped<ISeatReleaseService, SeatReleaseService>();
builder.Services.AddScoped<IJobService, HangfireJobService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IEmailTemplateService, EmailTemplateService>();
builder.Services.AddScoped<ITicketPdfService, TicketPdfService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IFanIdPdfService, FanIdPdfService>();
builder.Services.AddScoped<IPaymentService, PaymobPaymentService>();
builder.Services.AddScoped<ICurrencyConverterService, CurrencyConverterService>();
builder.Services.AddScoped<IPricingService, TicketBookingSystem.Application.Services.PricingService>();
builder.Services.AddAuthorization();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentityCore<TicketBookingSystem.Domain.Entities.User>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;

    // Account lockout on repeated failed login attempts
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddScoped<IApplicationDbContext>(provider
    => provider.GetRequiredService<ApplicationDbContext>());

builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssembly(typeof(TicketBookingSystem.Application.Features.Events.Commands.ManageEventCommand).Assembly);
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});

builder.Services.AddValidatorsFromAssembly(typeof(TicketBookingSystem.Application.Features.Bookings.Commands.BookSeatCommandValidator).Assembly);

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSignalR();
builder.Services.AddScoped<ITicketHubService, TicketHubService>();
builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddOpenApiDocument(config =>
{
    config.Title = "TicketBookingSystem API";
    config.Version = "v1";
    config.AddSecurity("Bearer", Enumerable.Empty<string>(), new NSwag.OpenApiSecurityScheme
    {
        Type = NSwag.OpenApiSecuritySchemeType.ApiKey,
        Name = "Authorization",
        In = NSwag.OpenApiSecurityApiKeyLocation.Header,
        Description = "Enter 'Bearer' [space] and then your token."
    });
    config.OperationProcessors.Add(new NSwag.Generation.Processors.Security.AspNetCoreOperationSecurityScopeProcessor("Bearer"));
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TicketBookingSystem.Infrastructure.Persistence.ApplicationDbContext>();
    dbContext.Database.Migrate();
}
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRateLimiter();
app.UseExceptionHandler();
app.UseCors("AllowSpecificOrigins");


app.UseOpenApi();
app.UseSwaggerUi();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new TicketBookingSystem.Api.Middlewares.HangfireAdminAuthorizationFilter() }
});
app.MapControllers();
app.MapHub<TicketHub>("/ticketHub");

// Seed Initial Admins
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    
    await AdminSeeder.SeedAdminsAsync(userManager, builder.Configuration);
}

app.Run();