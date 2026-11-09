using System.Xml.Linq;
using GABERA.Api.Models;

namespace GABERA.Api.Services;

public sealed class NewsStore
{
    private readonly string _path;
    private readonly object _lock = new();

    public NewsStore(IHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "news.xml");
    }

    // Replaces the whole stored collection.
    public void Save(IEnumerable<NewItem> items)
    {
        var doc = new XDocument(
            new XElement("news",
                items.Select((i, index) => new XElement("newsItem",
                    new XAttribute("index", index),
                    new XElement("title", i.Title),
                    new XElement("text", i.Text),
                    new XElement("active", i.Active),
                    new XElement("color", i.Color),
                    new XElement("backgroundColor", i.BackgroundColor),
                    new XElement("fontBold", i.FontBold),
                    new XElement("showLine", i.ShowLine),
                    new XElement("panelColor", i.PanelColor)))));

        lock (_lock)
        {
            var tmp = _path + ".tmp";
            doc.Save(tmp);
            File.Move(tmp, _path, overwrite: true);
        }
    }

    // Returns false when the index is out of range.
    public bool Delete(int index)
    {
        lock (_lock)
        {
            var items = Load();
            if (index < 0 || index >= items.Count) return false;

            items.RemoveAt(index);
            Save(items);
            return true;
        }
    }

    // Moves the item at `from` so it ends up at `to`; returns false when either index is out of range.
    public bool Move(int from, int to)
    {
        lock (_lock)
        {
            var items = Load();
            if (from < 0 || from >= items.Count || to < 0 || to >= items.Count) return false;

            var item = items[from];
            items.RemoveAt(from);
            items.Insert(to, item);
            Save(items);
            return true;
        }
    }

    public List<NewItem> Load()
    {
        lock (_lock)
        {
            if (!File.Exists(_path)) return [];

            return XDocument.Load(_path).Root!.Elements("newsItem")
                .Select(e => new NewItem
                {
                    Title = (string?)e.Element("title") ?? string.Empty,
                    Text = (string?)e.Element("text") ?? string.Empty,
                    Active = (bool?)e.Element("active") ?? false,
                    Color = (string?)e.Element("color") ?? string.Empty,
                    BackgroundColor = (string?)e.Element("backgroundColor") ?? string.Empty,
                    FontBold = (bool?)e.Element("fontBold") ?? false,
                    ShowLine = (bool?)e.Element("showLine") ?? false,
                    PanelColor = (string?)e.Element("panelColor") ?? string.Empty
                })
                .ToList();
        }
    }
}
