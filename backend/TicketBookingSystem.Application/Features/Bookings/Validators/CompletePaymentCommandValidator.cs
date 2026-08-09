using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TicketBookingSystem.Application.Features.Bookings.Commands;

namespace TicketBookingSystem.Application.Features.Bookings.Validators
{
    public class CompletePaymentCommandValidator : AbstractValidator<CompletePaymentCommand>
    {
        public CompletePaymentCommandValidator()
        {
            RuleFor(v => v.OrderId)
                .GreaterThan(0).WithMessage("Order ID must be greater than 0.");
        }
    }
}
