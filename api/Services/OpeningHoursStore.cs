using System.Xml.Linq;
using GABERA.Api.Models;

namespace GABERA.Api.Services;

public sealed class OpeningHoursStore
{
    private readonly string _path;
    private readonly object _lock = new();

    public OpeningHoursStore(IHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "openinghours.xml");
    }

    public void Save(OpeningHoursData data)
    {
        var doc = new XDocument(
            new XElement("openingHours",
                data.Offices.Select(office => new XElement("office",
                    new XAttribute("id", office.Id),
                    office.Days.Select(day => new XElement("day",
                        new XAttribute("key", day.Key),
                        day.Rows.Select((row, index) => new XElement("row",
                            new XAttribute("index", index),
                            new XElement("time", row.Time),
                            row.Services.Select(service => new XElement("service",
                                new XAttribute("lang", service.Key),
                                service.Value)))))))),
                data.BloodDraw is null ? null : new XElement("bloodDraw",
                    data.BloodDraw.Notice.Select(XmlLang.Element("notice")),
                    data.BloodDraw.Rows.Select((row, index) => new XElement("row",
                        new XAttribute("index", index),
                        row.Day.Select(XmlLang.Element("day")),
                        row.Time.Select(XmlLang.Element("time")))))));

        lock (_lock)
        {
            var tmp = _path + ".tmp";
            doc.Save(tmp);
            File.Move(tmp, _path, overwrite: true);
        }
    }

    // Returns no offices when nothing has been saved yet, so the site defaults apply.
    public OpeningHoursData Load()
    {
        lock (_lock)
        {
            if (!File.Exists(_path)) return new OpeningHoursData();

            var root = XDocument.Load(_path).Root!;
            var bloodDraw = root.Element("bloodDraw");
            return new OpeningHoursData
            {
                BloodDraw = bloodDraw is null ? null : new BloodDrawHours
                {
                    Notice = XmlLang.Read(bloodDraw, "notice"),
                    Rows = bloodDraw.Elements("row")
                        .OrderBy(row => (int?)row.Attribute("index") ?? int.MaxValue)
                        .Select(row => new BloodDrawRow { Day = XmlLang.Read(row, "day"), Time = XmlLang.Read(row, "time") })
                        .ToList()
                },
                Offices = root.Elements("office").Select(office => new OfficeHours
                {
                    Id = (string?)office.Attribute("id") ?? string.Empty,
                    Days = office.Elements("day").Select(day => new DayHours
                    {
                        Key = (string?)day.Attribute("key") ?? string.Empty,
                        Rows = day.Elements("row")
                            .OrderBy(row => (int?)row.Attribute("index") ?? int.MaxValue)
                            .Select(row => new RowHours
                            {
                                Time = (string?)row.Element("time") ?? string.Empty,
                                Services = row.Elements("service")
                                    .Where(s => !string.IsNullOrEmpty((string?)s.Attribute("lang")))
                                    .ToDictionary(s => (string)s.Attribute("lang")!, s => s.Value)
                            }).ToList()
                    }).ToList()
                }).ToList()
            };
        }
    }
}
