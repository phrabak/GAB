import apiClient from "@/lib/apiClient";

export async function getContacts() {
  const { data } = await apiClient.get("/info/contacts");
  return data;
}

export async function saveContacts(contacts) {
  await apiClient.post("/info/contacts", contacts);
}
