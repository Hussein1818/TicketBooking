using FluentValidation;
using System;
using TicketBookingSystem.Application.Features.Events.Commands;

namespace TicketBookingSystem.Application.Features.Events.Validators;

public class ManageEventCommandValidator : AbstractValidator<ManageEventCommand>
{
    public ManageEventCommandValidator()
    {
        RuleFor(v => v.Name)
            .NotEmpty().WithMessage("Event name is required.")
            .MaximumLength(200).WithMessage("Event name must not exceed 200 characters.");

        RuleFor(v => v.EventDate)
            .GreaterThan(DateTime.UtcNow).WithMessage("Event date must be in the future.")
            .When(v => v.Id == 0, ApplyConditionTo.CurrentValidator);

        RuleFor(v => v.Venue)
            .NotEmpty().WithMessage("Venue is required.")
            .MaximumLength(300).WithMessage("Venue must not exceed 300 characters.");

        RuleFor(v => v.MaxTicketsPerUser)
            .GreaterThan(0).WithMessage("Max tickets per user must be greater than 0.")
            .LessThanOrEqualTo(50).WithMessage("Max tickets per user must not exceed 50.");

        RuleFor(v => v.Category)
            .NotEmpty().WithMessage("Category is required.")
            .MaximumLength(50).WithMessage("Category must not exceed 50 characters.");

        RuleFor(v => v.PartialRefundPercentage)
            .InclusiveBetween(0, 100).WithMessage("Partial refund percentage must be between 0 and 100.");

        RuleFor(v => v.FullRefundDays)
            .GreaterThanOrEqualTo(0).WithMessage("Full refund days cannot be negative.")
            .GreaterThanOrEqualTo(v => v.PartialRefundDays).WithMessage("Full refund days must be greater than or equal to partial refund days.");

        RuleFor(v => v.PartialRefundDays)
            .GreaterThanOrEqualTo(0).WithMessage("Partial refund days cannot be negative.");

        RuleFor(v => v.TicketPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Ticket price cannot be negative.");

        RuleFor(v => v.RegularSeatsCount)
            .GreaterThanOrEqualTo(0).WithMessage("Regular seats cannot be negative.");

        RuleFor(v => v.VipSeatsCount)
            .GreaterThanOrEqualTo(0).WithMessage("VIP seats cannot be negative.");

        RuleFor(v => v.VipTicketPrice)
            .GreaterThanOrEqualTo(0).WithMessage("VIP ticket price cannot be negative.");

        RuleFor(v => v)
            .Must(v => v.RegularSeatsCount > 0 || v.VipSeatsCount > 0)
            .WithMessage("You must create at least one seat (Regular or VIP).")
            .When(v => v.Id == 0);
    }
}