using Microsoft.AspNetCore.Diagnostics;
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
            _ => StatusCodes.Status500InternalServerError
        };

        httpContext.Response.StatusCode = statusCode;

        
        object response;

       
        if (exception is ValidationException validationEx)
        {
            response = new
            {
                Title = "Validation Error",
                Message = validationEx.Message,
                Errors = validationEx.Errors, 
                StatusCode = statusCode
            };
        }
        else
        {
            response = new
            {
                Title = exception.GetType().Name,
                Message = exception.Message,
                StatusCode = statusCode
            };
        }


        await httpContext.Response.WriteAsJsonAsync(response, CancellationToken.None);

        return true;
    }
}