import apiClient from "@/lib/apiClient";

export async function getNews() {
  const { data } = await apiClient.get("/info/news");
  return data;
}

// SaveNews overwrites the whole collection, so the item at `index` is replaced (or appended when new) before posting.
// Returns the index the item was stored at.
export async function saveNewsItem({ item, index }) {
  const items = [...(await getNews())];
  const target = index !== null && index < items.length ? index : items.length;
  items[target] = item;
  await apiClient.post("/info/news", { newsItem: items });
  return target;
}

export async function setAllNewsActive(active) {
  const items = (await getNews()).map((item) => ({ ...item, active }));
  await apiClient.post("/info/news", { newsItem: items });
}

export async function deleteNewsItem(index) {
  await apiClient.delete(`/info/news/${index}`);
}

export async function moveNewsItem({ from, to }) {
  await apiClient.post(`/info/news/${from}/move/${to}`);
}
