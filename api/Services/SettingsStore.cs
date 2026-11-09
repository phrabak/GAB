using System.Xml.Linq;
using GABERA.Api.Models;

namespace GABERA.Api.Services;

public sealed class SettingsStore
{
    private readonly string _path;
    private readonly object _lock = new();

    public SettingsStore(IHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "settings.xml");
        if (!File.Exists(_path)) Save(new AppSettings());
    }

    public void Save(AppSettings settings)
    {
        var doc = new XDocument(
            new XElement("settings",
                new XElement("services",
                    (settings.Services ?? []).Select(entry => new XElement("language",
                        new XAttribute("code", entry.Key),
                        (entry.Value ?? []).Select((text, index) => new XElement("service",
                            new XAttribute("index", index),
                            text)))))));

        if (settings.Team is not null)
        {
            doc.Root!.Add(new XElement("team",
                settings.Team.Select((member, index) => new XElement("member",
                    new XAttribute("index", index),
                    new XAttribute("role", member.Role),
                    new XAttribute("firstName", member.FirstName),
                    new XAttribute("lastName", member.LastName)))));
        }

        lock (_lock)
        {
            var tmp = _path + ".tmp";
            doc.Save(tmp);
            File.Move(tmp, _path, overwrite: true);
        }
    }

    // Returns the defaults when the file does not exist yet.
    public AppSettings Load()
    {
        lock (_lock)
        {
            if (!File.Exists(_path)) return new AppSettings();

            var root = XDocument.Load(_path).Root!;
            return new AppSettings
            {
                Services = (root.Element("services")?.Elements("language") ?? [])
                    .Where(e => !string.IsNullOrEmpty((string?)e.Attribute("code")))
                    .ToDictionary(
                        e => (string)e.Attribute("code")!,
                        e => e.Elements("service")
                            .OrderBy(s => (int?)s.Attribute("index") ?? int.MaxValue)
                            .Select(s => s.Value)
                            .ToList()),
                Team = root.Element("team")?.Elements("member")
                    .OrderBy(m => (int?)m.Attribute("index") ?? int.MaxValue)
                    .Select(m => new TeamMember
                    {
                        Role = (string?)m.Attribute("role") ?? string.Empty,
                        FirstName = (string?)m.Attribute("firstName") ?? string.Empty,
                        LastName = (string?)m.Attribute("lastName") ?? string.Empty
                    })
                    .ToList()
            };
        }
    }
}
