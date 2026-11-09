namespace GABERA.Api.Models;

// All texts are keyed by language code.
public sealed class PreventiveCheckupsData
{
    public Dictionary<string, string> Title { get; set; } = [];
    public Dictionary<string, string> ColumnLabel { get; set; } = [];

    // Null until saved, so the site defaults apply.
    public List<Dictionary<string, string>>? Rows { get; set; }
}
