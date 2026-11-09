namespace GABERA.Api.Models;

public sealed class AppSettings
{
    // Services listed on the About Us page, keyed by language code; a missing language means the site defaults apply.
    public Dictionary<string, List<string>> Services { get; set; } = [];

    // Doctors and nurses on the About Us page; null means the site default team applies.
    public List<TeamMember>? Team { get; set; }
}
