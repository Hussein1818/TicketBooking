# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy all csproj files to restore dependencies first (for faster caching)
COPY ["TicketBookingSystem.Api/TicketBookingSystem.Api.csproj", "TicketBookingSystem.Api/"]
COPY ["TicketBookingSystem.Application/TicketBookingSystem.Application.csproj", "TicketBookingSystem.Application/"]
COPY ["TicketBookingSystem.Domain/TicketBookingSystem.Domain.csproj", "TicketBookingSystem.Domain/"]
COPY ["TicketBookingSystem.Infrastructure/TicketBookingSystem.Infrastructure.csproj", "TicketBookingSystem.Infrastructure/"]

RUN dotnet restore "TicketBookingSystem.Api/TicketBookingSystem.Api.csproj"

# Copy the rest of the code and build
COPY . .
WORKDIR "/src/TicketBookingSystem.Api"
RUN dotnet publish "TicketBookingSystem.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "TicketBookingSystem.Api.dll"]