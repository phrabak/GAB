# GABERA – Hosting Requirements (Windows / IIS)

The solution has two parts:

| Part | Technology | What runs on the server |
|---|---|---|
| **API** (`api/`) | ASP.NET Core Web API, **.NET 10** (`net10.0`) | A .NET process hosted by IIS through ASP.NET Core Module V2 |
| **Frontend** (`fe/`) | Next.js 16 + React 19, static export (`output: "export"`) | Only static files (HTML, JS, CSS, images). No Node.js process. |

The API stores its data in XML files (`news.xml`, `secrets.xml`), so there is **no database**.

---

## 1. Mandatory components on the provider's server

### 1.1 Operating system

| Component | Requirement |
|---|---|
| **Windows Server** | 2016 or newer, 64-bit. 2022 or 2025 is recommended. It must be on the [.NET 10 supported OS list](https://github.com/dotnet/core/blob/main/release-notes/10.0/supported-os.md). |

### 1.2 IIS (Web Server role)

| IIS role service | Feature name (PowerShell) | Mandatory | Why |
|---|---|---|---|
| Web Server (IIS) | `Web-Server` | **Yes** | Hosts the API and the frontend |
| Default Document | `Web-Default-Doc` | **Yes** | Serves `index.html` for folder URLs |
| Static Content | `Web-Static-Content` | **Yes** | Serves static files (needed for the two-site layout, harmless otherwise) |
| HTTP Errors | `Web-Http-Errors` | **Yes** | Standard error responses |
| Request Filtering | `Web-Filtering` | **Yes** | Basic request security; blocks `web.config`, `bin`, etc. |
| HTTP Logging | `Web-Http-Logging` | Recommended | Access logs for troubleshooting |
| Static Content Compression | `Web-Stat-Compression` | Recommended | Smaller JS/CSS downloads |
| HTTP Redirection | `Web-Http-Redirect` | Recommended | HTTP to HTTPS redirect |
| IIS Management Console | `Web-Mgmt-Console` | Recommended | Administration |

Install command (run by the provider):

```powershell
Install-WindowsFeature Web-Server, Web-Default-Doc, Web-Static-Content, Web-Http-Errors, Web-Filtering, Web-Http-Logging, Web-Stat-Compression, Web-Http-Redirect, Web-Mgmt-Console
```

**Not needed:** ASP.NET 4.x (`Web-Asp-Net45`), .NET Framework 3.5/4.x extensibility, CGI, ISAPI, Classic ASP and WebSockets. ASP.NET Core does **not** use the classic .NET Framework pipeline.

### 1.3 ASP.NET Core 10.0 Hosting Bundle

This is the **most important component**. Without it, IIS cannot start the API (you get *HTTP Error 500.19* or *500.31*).

| Item | Detail |
|---|---|
| Package | **ASP.NET Core Runtime 10.0.x – Windows Hosting Bundle** |
| Version | The **latest 10.0.x patch**. The API references `Microsoft.AspNetCore.OpenApi` 10.0.12, so the runtime must be **10.0.12 or newer**. |
| Download | https://dotnet.microsoft.com/download/dotnet/10.0 |
| Contains | .NET Runtime 10.0 (`Microsoft.NETCore.App`), ASP.NET Core Runtime 10.0 (`Microsoft.AspNetCore.App`), **ASP.NET Core Module V2** (`AspNetCoreModuleV2`) for IIS |
| Install order | Install **IIS first**, then the Hosting Bundle. If IIS was added later, run the Hosting Bundle installer again and choose **Repair**. |
| After install | Restart IIS: `net stop was /y` then `net start w3svc` |

Even a **self-contained** build of the API still needs `AspNetCoreModuleV2`, which comes with the Hosting Bundle. So the Hosting Bundle is mandatory either way.

**Not needed:** the .NET SDK (only used for building), the .NET Desktop Runtime and .NET Framework 4.x.

### 1.4 TLS / HTTPS

| Component | Why |
|---|---|
| **SSL/TLS certificate** for your domain (for example Let's Encrypt via win-acme, or a purchased one) | The login sends a password and the API returns a bearer token. Both must only travel over HTTPS. |
| **HTTPS binding** (port 443) on the IIS site | — |

### 1.5 Optional IIS add-ons

| Component | Why |
|---|---|
| **URL Rewrite 2.1** | HTTP to HTTPS redirect rules, `www` to non-`www` redirects |
| **Web Deploy 4.0** | Publish directly from Visual Studio or VS Code. FTPS also works. |
| **Application Request Routing (ARR) 3.0** | Only for the two-site layout when `/api` is proxied from the frontend site |

### 1.6 Not needed on the server

- **Node.js / npm.** They are only used on the build machine; the frontend is pre-built into static files.
- **Database server** (SQL Server, MySQL, …).
- **PHP, Java, Python.**

---

## 2. IIS site and application pool settings

| Setting | Value | Why |
|---|---|---|
| Application pool → .NET CLR version | **No Managed Code** | ASP.NET Core does not use the CLR v4 pipeline |
| Application pool → Pipeline mode | **Integrated** | — |
| Application pool → Enable 32-bit applications | **False** | 64-bit process |
| Application pool → Maximum Worker Processes | **1** | `news.xml` and `secrets.xml` are locked in memory; several processes could corrupt them |
| Application pool identity | `ApplicationPoolIdentity` (default) | — |
| Folder permissions | **Modify** for `IIS AppPool\<PoolName>` on the site folder | The API writes `news.xml`, `secrets.xml` and their `.tmp` files |
| Environment variable | `ASPNETCORE_ENVIRONMENT=Production` | Turns off development features (OpenAPI endpoint) |
| Hosting model | `inprocess` (default in the generated `web.config`) | Best performance; one app per application pool |
| Bindings | `http` :80 and `https` :443 for your domain | — |

---

## 3. Build machine requirements (your PC, not the server)

| Tool | Version | Used for |
|---|---|---|
| **.NET SDK** | 10.0.x | `dotnet publish` of the API |
| **Node.js** | 20.9 or newer (LTS recommended) | `yarn install` and `yarn build` of the frontend |
| **Yarn** | 1.x (classic), `npm install -g yarn` | Frontend dependencies (`fe\yarn.lock`) |

---

## 4. Publish and deploy

### 4.1 Recommended layout: one IIS site

The API runs at the site root and also serves the frontend from `wwwroot`. Both share one domain, so the frontend's default `/api` base URL works and **no CORS** is needed.

```
C:\inetpub\gabera\            <- IIS site physical path
  GABERA.Api.dll
  GABERA.Api.exe
  web.config                  <- generated by dotnet publish
  appsettings.json
  news.xml                    <- data (keep on redeploy)
  secrets.xml                 <- data (keep on redeploy, never in wwwroot)
  wwwroot\                    <- contents of fe\out\
    index.html
    _next\...
```

Build steps (run from the repository root):

**1. Frontend production build** (Node.js 20.9+). The output is static files in `fe\out`.

```powershell
cd fe

# NEXT_PUBLIC_* values are baked into the JS at build time.
# A shell variable overrides fe\.env.local (which points to https://localhost:5001/api for development).
$env:NEXT_PUBLIC_API_BASE_URL = "/api"

yarn install --frozen-lockfile
yarn build             # runs "next build" with output: "export" -> fe\out

Remove-Item Env:NEXT_PUBLIC_API_BASE_URL
cd ..
```

**2. API production build** (.NET SDK 10). The output is a ready-to-upload folder with `web.config`.

```powershell
cd api
dotnet publish -c Release -o ..\publish
cd ..
```

**3. Combine both into one deployable folder**

```powershell
# Remove the previous frontend copy so deleted files do not linger
Remove-Item publish\wwwroot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory publish\wwwroot | Out-Null
Copy-Item fe\out\* publish\wwwroot -Recurse -Force
```

Check before uploading:

- `publish\GABERA.Api.dll` and `publish\web.config` exist.
- `publish\wwwroot\index.html` exists.
- `publish\wwwroot` does **not** contain `news.xml` or `secrets.xml`.

Upload the contents of `publish\` to the site folder. Do **not** overwrite `news.xml` and `secrets.xml` on the server after the first deployment.

Do **not** create an IIS sub-application named `/api`, because the URLs would become `/api/api/...`.

## 5. Required code changes before publishing

| Change | File | Why |
|---|---|---|
| Add `app.UseDefaultFiles();` and `app.UseStaticFiles();` before `app.MapControllers();` | `api/Program.cs` | Serve the frontend from `wwwroot` (one-site layout) |
| Set `AllowedHosts` to your domain | `api/appsettings.json` | Reject requests sent with other host names |
| Add `app.UseHttpsRedirection();` and `app.UseHsts();` in production | `api/Program.cs` | Force HTTPS |
| **Protect admin endpoints** (`set-password`, news save/delete/move) with real authentication and `[Authorize]` | `api/Controllers/*.cs` | **Security:** these endpoints are currently open to anyone on the internet |
| Exclude `news.xml` and `secrets.xml` from publish, or never overwrite them on the server | `api/GABERA.Api.csproj` / deploy process | Keep the live data |

---

## 6. Transfer files to the server

```powershell
# add it to PATH for the current session
$env:Path += ";$env:LOCALAPPDATA\Programs\WinSCP"

# Example WinSCP sync, excluding the data files:
& "$env:LOCALAPPDATA\Programs\WinSCP\WinSCP.com" `
  /command `
  "open ftpes://user:pwd@d118wh.forpsi.com/" `
  "synchronize remote -delete -filemask=|news.xml;secrets.xml;appsettings.Production.json .\publish /subsoms/test" `
  "exit"
# Drop -delete if you don't want remote files removed.
# -filemask=|news.xml;secrets.xml;appsettings.Production.json excludes those files from both upload and deletion
```

If you get **500.19**, the Hosting Bundle is missing. **500.31** or **500.30** means a missing or wrong .NET runtime version, or the app failed to start (check the Windows Event Log → Application). **403/404 on `/`** means `UseDefaultFiles`/`UseStaticFiles` is missing or `wwwroot` is empty.
