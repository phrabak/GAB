import apiClient from "@/lib/apiClient";

export async function getOpeningHours() {
  const { data } = await apiClient.get("/info/openinghours");
  return data;
}

export async function saveOpeningHours(openingHours) {
  await apiClient.post("/info/openinghours", openingHours);
}
