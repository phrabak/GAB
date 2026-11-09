using GABERA.Api.Models;
using GABERA.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GABERA.Api.Controllers;

[ApiController]
[Route("api/info")]
public sealed class InfoController(NewsStore store, SettingsStore settingsStore, OpeningHoursStore openingHoursStore, PreventiveCheckupsStore checkupsStore, ContactsStore contactsStore) : ControllerBase
{
    private const int ServiceTextMaxLength = 1000;
    private const int TimeMaxLength = 50;
    private const int KeyMaxLength = 10;
    private const int MaxRowsPerDay = 20;
    private const int MaxCheckupRows = 50;
    private const int MaxTeamMembers = 50;
    private const int NameMaxLength = 100;
    private const int PracticeCount = 2;
    private const int MaxDoctorsPerPractice = 10;
    private const int ContactTextMaxLength = 200;

    [HttpPost("news")]
    public IActionResult SaveNews([FromBody] Informations informations)
    {
        store.Save(informations.NewsItem);
        return NoContent();
    }

    [HttpGet("news")]
    public ActionResult<List<NewItem>> GetNews() => store.Load();

    [HttpDelete("news/{index:int}")]
    public IActionResult DeleteItem(int index) => store.Delete(index) ? NoContent() : NotFound();

    [HttpPost("news/{from:int}/move/{to:int}")]
    public IActionResult MoveItem(int from, int to) => store.Move(from, to) ? NoContent() : NotFound();

    [HttpGet("settings")]
    public ActionResult<AppSettings> GetSettings() => settingsStore.Load();

    [HttpPost("settings")]
    public IActionResult SaveSettings([FromBody] AppSettings settings)
    {
        var services = new Dictionary<string, List<string>>();
        foreach (var (code, texts) in settings.Services ?? [])
        {
            var cleaned = (texts ?? []).Select(t => t?.Trim() ?? string.Empty).Where(t => t.Length > 0).ToList();
            if (cleaned.Any(t => t.Length > ServiceTextMaxLength)) return BadRequest();
            if (code.Length is 0 or > 10 || cleaned.Count == 0) continue;
            services[code] = cleaned;
        }

        settings.Services = services;

        if (settings.Team is not null)
        {
            if (settings.Team.Count > MaxTeamMembers) return BadRequest();
            var team = new List<TeamMember>();
            foreach (var member in settings.Team)
            {
                if (member is null || member.Role is not ("doctor" or "nurse")) return BadRequest();
                var firstName = member.FirstName?.Trim() ?? string.Empty;
                var lastName = member.LastName?.Trim() ?? string.Empty;
                if (firstName.Length > NameMaxLength || lastName.Length > NameMaxLength) return BadRequest();
                if (firstName.Length == 0 && lastName.Length == 0) continue;
                team.Add(new TeamMember { Role = member.Role, FirstName = firstName, LastName = lastName });
            }

            settings.Team = team;
        }

        settingsStore.Save(settings);
        return NoContent();
    }

    [HttpGet("openinghours")]
    public ActionResult<OpeningHoursData> GetOpeningHours() => openingHoursStore.Load();

    [HttpPost("openinghours")]
    public IActionResult SaveOpeningHours([FromBody] OpeningHoursData data)
    {
        var offices = data.Offices ?? [];
        if (offices.Count > 10) return BadRequest();

        foreach (var office in offices)
        {
            if (!IsKey(office.Id)) return BadRequest();
            office.Days ??= [];
            if (office.Days.Count > 31) return BadRequest();

            foreach (var day in office.Days)
            {
                if (!IsKey(day.Key)) return BadRequest();
                day.Rows ??= [];
                if (day.Rows.Count > MaxRowsPerDay) return BadRequest();

                foreach (var row in day.Rows)
                {
                    row.Time = row.Time?.Trim() ?? string.Empty;
                    row.Services ??= [];
                    if (row.Time.Length > TimeMaxLength) return BadRequest();
                    if (row.Services.Any(s => !IsKey(s.Key) || (s.Value?.Length ?? 0) > ServiceTextMaxLength)) return BadRequest();

                    row.Services = row.Services.ToDictionary(s => s.Key, s => s.Value?.Trim() ?? string.Empty);
                }
            }
        }

        if (data.BloodDraw is { } bloodDraw)
        {
            var notice = CleanTexts(bloodDraw.Notice, ServiceTextMaxLength);
            if (notice is null) return BadRequest();
            bloodDraw.Notice = notice;

            bloodDraw.Rows ??= [];
            if (bloodDraw.Rows.Count > MaxRowsPerDay) return BadRequest();

            foreach (var row in bloodDraw.Rows)
            {
                var day = CleanTexts(row.Day, TimeMaxLength);
                var time = CleanTexts(row.Time, TimeMaxLength);
                if (day is null || time is null) return BadRequest();
                row.Day = day;
                row.Time = time;
            }
        }

        openingHoursStore.Save(data);
        return NoContent();
    }

    [HttpGet("preventivecheckups")]
    public ActionResult<PreventiveCheckupsData> GetPreventiveCheckups() => checkupsStore.Load();

    [HttpPost("preventivecheckups")]
    public IActionResult SavePreventiveCheckups([FromBody] PreventiveCheckupsData data)
    {
        var title = CleanTexts(data.Title, ServiceTextMaxLength);
        var columnLabel = CleanTexts(data.ColumnLabel, ServiceTextMaxLength);
        if (title is null || columnLabel is null) return BadRequest();
        data.Title = title;
        data.ColumnLabel = columnLabel;

        if (data.Rows is { } rows)
        {
            if (rows.Count > MaxCheckupRows) return BadRequest();

            for (var i = 0; i < rows.Count; i++)
            {
                var cleaned = CleanTexts(rows[i], ServiceTextMaxLength);
                if (cleaned is null) return BadRequest();
                rows[i] = cleaned;
            }
        }

        checkupsStore.Save(data);
        return NoContent();
    }

    [HttpGet("contacts")]
    public ActionResult<ContactsData> GetContacts() => contactsStore.Load();

    [HttpPost("contacts")]
    public IActionResult SaveContacts([FromBody] ContactsData data)
    {
        if (data.Practices is not { Count: PracticeCount } practices) return BadRequest();

        foreach (var practice in practices)
        {
            if (practice is null) return BadRequest();

            practice.Doctors ??= [];
            if (practice.Doctors.Count > MaxDoctorsPerPractice) return BadRequest();
            practice.Doctors = practice.Doctors.Select(d => d?.Trim() ?? string.Empty).Where(d => d.Length > 0).ToList();
            if (practice.Doctors.Any(d => d.Length > ContactTextMaxLength)) return BadRequest();

            practice.Phone = practice.Phone?.Trim() ?? string.Empty;
            practice.Email = practice.Email?.Trim() ?? string.Empty;
            practice.DataBox = practice.DataBox?.Trim() ?? string.Empty;
            practice.Facebook = practice.Facebook?.Trim() ?? string.Empty;
            if (new[] { practice.Phone, practice.Email, practice.DataBox, practice.Facebook }.Any(v => v.Length > ContactTextMaxLength)) return BadRequest();

            // The address is rendered as a link, so only web addresses are accepted.
            if (practice.Facebook.Length > 0 &&
                !(Uri.TryCreate(practice.Facebook, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https"))
                return BadRequest();
        }

        contactsStore.Save(data);
        return NoContent();
    }

    // Returns null when a key or text is invalid.
    private static Dictionary<string, string>? CleanTexts(Dictionary<string, string>? texts, int maxLength)
    {
        texts ??= [];
        if (texts.Any(t => !IsKey(t.Key) || (t.Value?.Length ?? 0) > maxLength)) return null;
        return texts.ToDictionary(t => t.Key, t => t.Value?.Trim() ?? string.Empty);
    }

    private static bool IsKey(string? value) => !string.IsNullOrEmpty(value) && value.Length <= KeyMaxLength;
}
