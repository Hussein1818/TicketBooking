using FluentValidation;
using TicketBookingSystem.Application.Features.Admin.Commands;

namespace TicketBookingSystem.Application.Features.Admin.Validators;

public class BlastCampaignCommandValidator : AbstractValidator<BlastCampaignCommand>
{
    public BlastCampaignCommandValidator()
    {
        RuleFor(v => v.EventId).GreaterThan(0).WithMessage("Event ID must be greater than 0.");
        RuleFor(v => v.Subject).NotEmpty().MaximumLength(150).WithMessage("Subject is required and cannot exceed 150 characters.");
        RuleFor(v => v.Message).NotEmpty().MaximumLength(1000).WithMessage("Message is required and cannot exceed 1000 characters.");
    }
}