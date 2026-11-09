namespace GABERA.Api.Models;

public sealed class TeamMember
{
    // "doctor" or "nurse".
    public string Role { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;
}
