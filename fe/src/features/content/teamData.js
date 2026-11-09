// Built-in team shown until the team is edited and saved to the settings.
export const DEFAULT_TEAM = [
  { role: "doctor", firstName: "Antonín", lastName: "Gabera" },
  { role: "doctor", firstName: "Pavla", lastName: "Šolteszová" },
  { role: "doctor", firstName: "Jana", lastName: "Kulhánková" },
  { role: "nurse", firstName: "Vlasta", lastName: "Hrabáková" },
  { role: "nurse", firstName: "Jaroslava", lastName: "Dupová" },
  { role: "nurse", firstName: "Lenka", lastName: "Rogozinská" },
];

// Doctors are written "MUDr. Surname First name", nurses "First name Surname".
export function displayName({ role, firstName, lastName }) {
  return role === "doctor" ? `MUDr. ${lastName} ${firstName}`.trim() : `${firstName} ${lastName}`.trim();
}

export function initials(name) {
  return name
    .replace(/^MUDr\.\s*/, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
