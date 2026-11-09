import apiClient from "@/lib/apiClient";

export async function getPreventiveCheckups() {
  const { data } = await apiClient.get("/info/preventivecheckups");
  return data;
}

export async function savePreventiveCheckups(checkups) {
  await apiClient.post("/info/preventivecheckups", checkups);
}
