using System.Xml.Linq;

namespace GABERA.Api.Services;

// Texts keyed by language code are stored as `<name lang="cs">text</name>` elements.
internal static class XmlLang
{
    public static Func<KeyValuePair<string, string>, XElement> Element(string name) =>
        pair => new XElement(name, new XAttribute("lang", pair.Key), pair.Value);

    public static Dictionary<string, string> Read(XElement parent, string name) =>
        parent.Elements(name)
            .Where(e => !string.IsNullOrEmpty((string?)e.Attribute("lang")))
            .ToDictionary(e => (string)e.Attribute("lang")!, e => e.Value);
}
