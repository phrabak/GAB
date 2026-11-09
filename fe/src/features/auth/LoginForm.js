"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { authAtom } from "@/store/atoms";
import { useTranslation } from "@/i18n/useTranslation";
import { login } from "./authApi";

export default function LoginForm({ open, onClose, onSignedIn }) {
  const { t } = useTranslation();
  const setAuth = useSetAtom(authAtom);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("auth_token", token);
      }
      setAuth({ isAuthenticated: true, token, user });
      setUsername("");
      setPassword("");
      onClose();
      onSignedIn?.();
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({ username, password });
  };

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <Typography variant="h5" component="h1" gutterBottom>
            {t("auth.signInTitle")}
          </Typography>

          <TextField
            label={t("auth.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />

          {mutation.isError && (
            <Alert severity="error">
              {mutation.error?.response?.status === 401 || mutation.error?.message === "Invalid credentials"
                ? t("auth.invalidCredentials")
                : t("auth.loginFailed")}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={mutation.isPending}
            fullWidth
          >
            {t("auth.signInButton")}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
