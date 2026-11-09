using System.Security.Cryptography;
using System.Xml.Linq;

namespace GABERA.Api.Services;

public sealed class SecretsStore
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 600_000;

    private readonly string _path;
    private readonly object _lock = new();

    public SecretsStore(IHostEnvironment env)
    {
        _path = Path.Combine(env.ContentRootPath, "secrets.xml");
    }

    // Stores a salted PBKDF2 hash, never the plain password.
    public void Set(string logoName, string pwd)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(pwd, salt, Iterations, HashAlgorithmName.SHA256, HashSize);

        lock (_lock)
        {
            var doc = File.Exists(_path)
                ? XDocument.Load(_path)
                : new XDocument(new XElement("secrets"));

            var root = doc.Root!;
            var entry = root.Elements("secret")
                .FirstOrDefault(e => string.Equals((string?)e.Attribute("logoName"), logoName, StringComparison.Ordinal));

            if (entry is null)
            {
                entry = new XElement("secret", new XAttribute("logoName", logoName));
                root.Add(entry);
            }

            entry.SetElementValue("salt", Convert.ToBase64String(salt));
            entry.SetElementValue("hash", Convert.ToBase64String(hash));
            entry.SetElementValue("iterations", Iterations);

            var tmp = _path + ".tmp";
            doc.Save(tmp);
            File.Move(tmp, _path, overwrite: true);
        }
    }

    public bool Verify(string logoName, string pwd)
    {
        lock (_lock)
        {
            if (!File.Exists(_path)) return false;

            var entry = XDocument.Load(_path).Root!.Elements("secret")
                .FirstOrDefault(e => string.Equals((string?)e.Attribute("logoName"), logoName, StringComparison.Ordinal));
            if (entry is null) return false;

            var salt = Convert.FromBase64String((string)entry.Element("salt")!);
            var expected = Convert.FromBase64String((string)entry.Element("hash")!);
            var iterations = (int)entry.Element("iterations")!;

            var actual = Rfc2898DeriveBytes.Pbkdf2(pwd, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
    }
}
