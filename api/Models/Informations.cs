using System.ComponentModel.DataAnnotations;

namespace GABERA.Api.Models;

public sealed class Informations
{
    [Required]
    public List<NewItem> NewsItem { get; set; } = new();
}
