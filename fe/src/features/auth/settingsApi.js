import apiClient from "@/lib/apiClient";

export async function getSettings() {
  const { data } = await apiClient.get("/info/settings");
  return data;
}

export async function saveSettings(settings) {
  await apiClient.post("/info/settings", settings);
}
