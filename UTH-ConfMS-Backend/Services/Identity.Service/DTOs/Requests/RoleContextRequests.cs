namespace Identity.Service.DTOs.Requests
{
    /// <summary>
    /// Request to switch user role context for a specific conference
    /// </summary>
    public class SwitchRoleContextRequest
    {
        [System.ComponentModel.DataAnnotations.Required]
        public Guid ConferenceId { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(50, MinimumLength = 1)]
        public string RoleName { get; set; } = string.Empty; // AUTHOR, REVIEWER, CONFERENCE_CHAIR
    }

    /// <summary>
    /// Request to get available role contexts for the user
    /// </summary>
    public class GetUserRoleContextsRequest
    {
        public Guid? ConferenceId { get; set; } // Optional - filter by conference
    }
}
