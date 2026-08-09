using FluentValidation;
using TicketBookingSystem.Application.Features.Notifications.Commands;

namespace TicketBookingSystem.Application.Features.Notifications.Validators;

public class MarkNotificationAsReadCommandValidator : AbstractValidator<MarkNotificationAsReadCommand>
{
    public MarkNotificationAsReadCommandValidator()
    {
        RuleFor(v => v.NotificationId)
            .GreaterThan(0).WithMessage("Notification ID must be greater than 0.");
    }
}