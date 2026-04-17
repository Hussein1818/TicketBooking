using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Exceptions;

namespace TicketBookingSystem.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        
        var statusCode = exception switch
        {
            ValidationException => StatusCodes.Status400BadRequest,
            NotFoundException => StatusCodes.Status404NotFound,
            BadRequestException => StatusCodes.Status400BadRequest,
            ConflictException => StatusCodes.Status409Conflict,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized, 
            _ => StatusCodes.Status500InternalServerError
        };

        
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = exception is ValidationException ? "Validation Error" : exception.GetType().Name,
            Detail = exception.Message,
            Instance = httpContext.Request.Path
        };

        
        if (exception is ValidationException validationEx)
        {
            problemDetails.Extensions["errors"] = validationEx.Errors;
        }

        httpContext.Response.StatusCode = statusCode;

        
        await httpContext.Response.WriteAsJsonAsync(problemDetails, CancellationToken.None);

        return true;
    }
}