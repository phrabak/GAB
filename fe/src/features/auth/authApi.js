import apiClient from "@/lib/apiClient";

// Demo fallback used when no real backend is configured (NEXT_PUBLIC_API_BASE_URL),
// so the scaffold is usable out of the box. Replace with a real API once available.
async function loginWithDemoFallback({ username, password }) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (username === "demo" && password === "demo") {
    return {
      token: "demo-token",
      user: { username, displayName: "Demo User" },
    };
  }
  throw new Error("Invalid credentials");
}

export async function login(credentials) {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    return loginWithDemoFallback(credentials);
  }

  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
}

export async function setPassword({ logoName, pwd }) {
  await apiClient.post("/auth/set-password", { logoName, pwd });
}
