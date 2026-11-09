namespace GABERA.Api.Models;

public sealed class ContactsData
{
    // Practice 1 and 2 in this order; null until saved, so the site defaults apply.
    public List<PracticeContact>? Practices { get; set; }
}

public sealed class PracticeContact
{
    // Full names including titles, one entry per doctor.
    public List<string> Doctors { get; set; } = [];

    public string Phone { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string DataBox { get; set; } = string.Empty;

    public string Facebook { get; set; } = string.Empty;
}
