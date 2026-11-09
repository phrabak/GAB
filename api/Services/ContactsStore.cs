using System.Xml.Linq;
using GABERA.Api.Models;

namespace GABERA.Api.Services;

public sealed class ContactsStore
{
    private readonly string _path;
    private readonly object _lock = new();

    public ContactsStore(IHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "contacts.xml");
    }

    public void Save(ContactsData data)
    {
        var doc = new XDocument(
            new XElement("contacts",
                data.Practices is null ? null : new XElement("practices",
                    data.Practices.Select((practice, index) => new XElement("practice",
                        new XAttribute("index", index),
                        new XElement("doctors",
                            practice.Doctors.Select((name, i) => new XElement("doctor", new XAttribute("index", i), name))),
                        new XElement("phone", practice.Phone),
                        new XElement("email", practice.Email),
                        new XElement("dataBox", practice.DataBox),
                        new XElement("facebook", practice.Facebook))))));

        lock (_lock)
        {
            var tmp = _path + ".tmp";
            doc.Save(tmp);
            File.Move(tmp, _path, overwrite: true);
        }
    }

    // Returns null practices when nothing has been saved yet, so the site defaults apply.
    public ContactsData Load()
    {
        lock (_lock)
        {
            if (!File.Exists(_path)) return new ContactsData();

            var root = XDocument.Load(_path).Root!;
            return new ContactsData
            {
                Practices = root.Element("practices")?.Elements("practice")
                    .OrderBy(p => (int?)p.Attribute("index") ?? int.MaxValue)
                    .Select(p => new PracticeContact
                    {
                        Doctors = (p.Element("doctors")?.Elements("doctor") ?? [])
                            .OrderBy(d => (int?)d.Attribute("index") ?? int.MaxValue)
                            .Select(d => d.Value)
                            .ToList(),
                        Phone = p.Element("phone")?.Value ?? string.Empty,
                        Email = p.Element("email")?.Value ?? string.Empty,
                        DataBox = p.Element("dataBox")?.Value ?? string.Empty,
                        Facebook = p.Element("facebook")?.Value ?? string.Empty
                    })
                    .ToList()
            };
        }
    }
}
