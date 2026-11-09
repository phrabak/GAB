import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

const defaultAuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
};

// Persisted in sessionStorage so a refresh keeps the user signed in but closing the browser signs out.
export const authAtom = atomWithStorage(
  "auth",
  defaultAuthState,
  createJSONStorage(() => sessionStorage)
);

// Not persisted so the app always starts on About Us.
export const selectedMenuAtom = atom("news");

// Not persisted so the app always starts in Czech.
export const localeAtom = atom("cs");
