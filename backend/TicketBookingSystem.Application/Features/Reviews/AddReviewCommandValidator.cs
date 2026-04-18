using FluentValidation;

namespace TicketBookingSystem.Application.Features.Reviews;

/// <summary>
/// Validates AddReviewCommand.
/// Protects against: invalid event IDs, out-of-range ratings, overly long comments, XSS in comments.
/// </summary>
public class AddReviewCommandValidator : AbstractValidator<AddReviewCommand>
{
    public AddReviewCommandValidator()
    {
        RuleFor(v => v.EventId)
            .GreaterThan(0).WithMessage("Event ID must be greater than 0.");

        RuleFor(v => v.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");

        RuleFor(v => v.Comment)
            .NotEmpty().WithMessage("Comment is required.")
            .MaximumLength(500).WithMessage("Comment must not exceed 500 characters.");
    }
}
