using System.ComponentModel.DataAnnotations;

namespace GABERA.Api.Models;

public sealed class LoginRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(200, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}
