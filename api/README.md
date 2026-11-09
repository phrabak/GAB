# GABERA API

ASP.NET Core Web API (.NET 10) used by the GABERA frontend (`../fe`).

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- A trusted HTTPS development certificate:

```powershell
dotnet dev-certs https --trust
```

## Run

From this folder (`api/`):

```powershell
dotnet run --launch-profile https
```

The API listens on `https://localhost:5001`.

For automatic restart on code changes:

```powershell
dotnet watch run --launch-profile https
```

## Build

```powershell
dotnet build
```

Full rebuild (stop the running API first, otherwise the executable is locked):

```powershell
dotnet clean; dotnet build --no-incremental
```

## Endpoints

### `POST /api/auth/set-password`

Saves a password for a login name. Request body (JSON):

```json
{ "logoName": "demo", "pwd": "MyNewPassword123" }
```

- `logoName`: required, 1-100 characters.
- `pwd`: required, 12-200 characters, at least one uppercase letter and one digit.

Responses: `204 No Content` on success, `400 Bad Request` when validation fails.

Example:

```powershell
Invoke-WebRequest -Uri https://localhost:5001/api/auth/set-password -Method Post `
  -ContentType 'application/json' `
  -Body '{"logoName":"demo","pwd":"MyNewPassword123"}'
```

## Data storage

Entries are stored in `secrets.xml` in the API root folder (created on first save, ignored by git). The password is never stored in plain text, only a salted PBKDF2-SHA256 hash (`salt`, `hash`, `iterations`). Saving an existing `logoName` overwrites its entry.

## Frontend configuration

Create `fe/.env.local` and restart the frontend dev server:

```
NEXT_PUBLIC_API_BASE_URL=https://localhost:5001/api
```

In Development, CORS allows the origin `http://localhost:3000`.
