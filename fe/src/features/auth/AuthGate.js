"use client";

import { useAtomValue } from "jotai";
import { authAtom } from "@/store/atoms";
import LoginForm from "./LoginForm";

export default function AuthGate({ children }) {
  const auth = useAtomValue(authAtom);

  if (!auth.isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
