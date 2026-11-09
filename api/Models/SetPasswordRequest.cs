using System.ComponentModel.DataAnnotations;

namespace GABERA.Api.Models;

public sealed class SetPasswordRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string LogoName { get; set; } = string.Empty;

    // Mirrors the frontend rules: 12+ chars, at least one uppercase letter and one digit.
    [Required, StringLength(200, MinimumLength = 12), RegularExpression(@"^(?=.*[A-Z])(?=.*[0-9]).+$")]
    public string Pwd { get; set; } = string.Empty;
}
