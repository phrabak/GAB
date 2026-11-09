using GABERA.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSingleton<SecretsStore>();
builder.Services.AddSingleton<NewsStore>();
builder.Services.AddSingleton<SettingsStore>();
builder.Services.AddSingleton<OpeningHoursStore>();
builder.Services.AddSingleton<PreventiveCheckupsStore>();
builder.Services.AddSingleton<ContactsStore>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.Run();
