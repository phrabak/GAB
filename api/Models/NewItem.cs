using System.ComponentModel.DataAnnotations;

namespace GABERA.Api.Models;

public sealed class NewItem
{
    [Required, StringLength(200, MinimumLength = 1)]
    public string Title { get; set; } = string.Empty;

    [StringLength(10000)]
    public string Text { get; set; } = string.Empty;

    public bool Active { get; set; }

    [StringLength(50)]
    public string Color { get; set; } = string.Empty;

    [StringLength(50)]
    public string BackgroundColor { get; set; } = string.Empty;

    public bool FontBold { get; set; }

    public bool ShowLine { get; set; }

    [StringLength(50)]
    public string PanelColor { get; set; } = string.Empty;
}
