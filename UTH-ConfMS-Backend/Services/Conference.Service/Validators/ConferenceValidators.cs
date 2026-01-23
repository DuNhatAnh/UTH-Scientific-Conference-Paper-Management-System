using FluentValidation;
using Conference.Service.DTOs.Requests;

namespace Conference.Service.Validators;

public class CreateConferenceRequestValidator : AbstractValidator<CreateConferenceRequest>
{
    public CreateConferenceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Conference name is required")
            .MaximumLength(255).WithMessage("Conference name must not exceed 255 characters");

        RuleFor(x => x.Acronym)
            .NotEmpty().WithMessage("Acronym is required")
            .MaximumLength(20).WithMessage("Acronym must not exceed 20 characters")
            .Matches(@"^[A-Za-z0-9-]+$").WithMessage("Acronym can only contain letters, numbers, and hyphens");

        RuleFor(x => x.Location)
            .MaximumLength(255).WithMessage("Location must not exceed 255 characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date")
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

        RuleFor(x => x.SubmissionDeadline)
            .LessThan(x => x.StartDate).WithMessage("Submission deadline must be before start date")
            .When(x => x.StartDate.HasValue && x.SubmissionDeadline.HasValue);
    }
}

public class UpdateConferenceRequestValidator : AbstractValidator<UpdateConferenceRequest>
{
    public UpdateConferenceRequestValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(255).WithMessage("Conference name must not exceed 255 characters")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Acronym)
            .MaximumLength(20).WithMessage("Acronym must not exceed 20 characters")
            .Matches(@"^[A-Za-z0-9-]+$").WithMessage("Acronym can only contain letters, numbers, and hyphens")
            .When(x => !string.IsNullOrEmpty(x.Acronym));

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate ?? DateTime.MinValue)
            .WithMessage("End date must be after start date")
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

        RuleFor(x => x.Location)
            .MaximumLength(255).WithMessage("Location must not exceed 255 characters")
            .When(x => !string.IsNullOrEmpty(x.Location));

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}

public class CreateTrackRequestValidator : AbstractValidator<CreateTrackRequest>
{
    public CreateTrackRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Track name is required")
            .MaximumLength(255).WithMessage("Track name must not exceed 255 characters");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");
    }
}

public class CreateDeadlineRequestValidator : AbstractValidator<CreateDeadlineRequest>
{
    public CreateDeadlineRequestValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Deadline type is required")
            .Must(type => new[] { "SUBMISSION", "REVISION", "NOTIFICATION", "CAMERA_READY" }.Contains(type))
            .WithMessage("Invalid deadline type");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Deadline date is required")
            .GreaterThan(DateTime.UtcNow).WithMessage("Deadline must be in the future");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");
    }
}

public class UpdateCallForPapersRequestValidator : AbstractValidator<UpdateCallForPapersRequest>
{
    public UpdateCallForPapersRequestValidator()
    {
        RuleFor(x => x.Description)
            .MaximumLength(5000).WithMessage("Description must not exceed 5000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Guidelines)
            .MaximumLength(5000).WithMessage("Guidelines must not exceed 5000 characters")
            .When(x => !string.IsNullOrEmpty(x.Guidelines));

        RuleFor(x => x.Topics)
            .Must(topics => topics == null || topics.Count <= 50)
            .WithMessage("Cannot have more than 50 topics");
    }
}
