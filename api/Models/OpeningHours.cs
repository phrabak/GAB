namespace GABERA.Api.Models;

public sealed class OpeningHoursData
{
    public List<OfficeHours> Offices { get; set; } = [];

    // Null until saved, so the site defaults apply.
    public BloodDrawHours? BloodDraw { get; set; }
}

// The blood-draw notice and the emergency-service table under it; all texts are keyed by language code.
public sealed class BloodDrawHours
{
    public Dictionary<string, string> Notice { get; set; } = [];
    public List<BloodDrawRow> Rows { get; set; } = [];
}

public sealed class BloodDrawRow
{
    public Dictionary<string, string> Day { get; set; } = [];
    public Dictionary<string, string> Time { get; set; } = [];
}

public sealed class OfficeHours
{
    public string Id { get; set; } = string.Empty;
    public List<DayHours> Days { get; set; } = [];
}

public sealed class DayHours
{
    // Language-neutral day key such as "mon"; the label comes from the site translations.
    public string Key { get; set; } = string.Empty;
    public List<RowHours> Rows { get; set; } = [];
}

public sealed class RowHours
{
    public string Time { get; set; } = string.Empty;

    // Service text keyed by language code.
    public Dictionary<string, string> Services { get; set; } = [];
}
