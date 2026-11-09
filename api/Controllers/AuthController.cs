using System.Security.Cryptography;
using GABERA.Api.Models;
using GABERA.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GABERA.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(SecretsStore store) : ControllerBase
{
    // Body is JSON (not query string) so the password never appears in URLs or logs.
    [HttpPost("set-password")]
    public IActionResult SetPassword([FromBody] SetPasswordRequest request)
    {
        store.Set(request.LogoName, request.Pwd);
        return NoContent();
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (!store.Verify(request.Username, request.Password))
            return Unauthorized();

        // Placeholder token: the API does not validate it yet; replace with JWT or a cookie session.
        return Ok(new
        {
            token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)),
            user = new { username = request.Username, displayName = request.Username }
        });
    }
}
