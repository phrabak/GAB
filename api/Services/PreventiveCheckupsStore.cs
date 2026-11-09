using System.Xml.Linq;
using GABERA.Api.Models;

namespace GABERA.Api.Services;

public sealed class PreventiveCheckupsStore
{
    private readonly string _path;
    private readonly object _lock = new();

    public PreventiveCheckupsStore(IHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "preventivecheckups.xml");
    }

    public void Save(PreventiveCheckupsData data)
    {
        var doc = new XDocument(
            new XElement("preventiveCheckups",
                data.Title.Select(XmlLang.Element("title")),
                data.ColumnLabel.Select(XmlLang.Element("columnLabel")),
                data.Rows is null ? null : new XElement("rows",
                    data.Rows.Select((row, index) => new XElement("row",
                        new XAttribute("index", index),
                        row.Select(XmlLang.Element("text")))))));

        lock (_lock)
        {
            var tmp = _path + ".tmp";
            doc.Save(tmp);
            File.Move(tmp, _path, overwrite: true);
        }
    }

    // Returns null rows when nothing has been saved yet, so the site defaults apply.
    public PreventiveCheckupsData Load()
    {
        lock (_lock)
        {
            if (!File.Exists(_path)) return new PreventiveCheckupsData();

            var root = XDocument.Load(_path).Root!;
            return new PreventiveCheckupsData
            {
                Title = XmlLang.Read(root, "title"),
                ColumnLabel = XmlLang.Read(root, "columnLabel"),
                Rows = root.Element("rows")?.Elements("row")
                    .OrderBy(row => (int?)row.Attribute("index") ?? int.MaxValue)
                    .Select(row => XmlLang.Read(row, "text"))
                    .ToList()
            };
        }
    }
}
