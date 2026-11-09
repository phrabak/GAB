"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { authAtom, selectedMenuAtom } from "@/store/atoms";
import { useTranslation } from "@/i18n/useTranslation";
import { setPassword } from "./authApi";

const MIN_LENGTH = 12;

function validatePassword(value) {
  if (value.length < MIN_LENGTH) return "setPassword.errorLength";
  if (!/[A-Z]/.test(value)) return "setPassword.errorUppercase";
  if (!/[0-9]/.test(value)) return "setPassword.errorNumber";
  return null;
}

export default function SetPassword() {
  const { t } = useTranslation();
  const auth = useAtomValue(authAtom);
  const setSelectedMenu = useSetAtom(selectedMenuAtom);
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: setPassword,
    onSuccess: () => {
      setPwd("");
      setPwdConfirm("");
      setSubmitted(false);
    },
  });

  useEffect(() => {
    if (!mutation.isSuccess) return;
    const timer = setTimeout(() => setSelectedMenu(null), 3000);
    return () => clearTimeout(timer);
  }, [mutation.isSuccess, setSelectedMenu]);

  const pwdErrorKey = validatePassword(pwd);
  const confirmErrorKey = pwd !== pwdConfirm ? "setPassword.errorMismatch" : null;
  const showPwdError = (submitted || pwd !== "") && pwdErrorKey;
  const showConfirmError = (submitted || pwdConfirm !== "") && confirmErrorKey;

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    mutation.reset();
    if (pwdErrorKey || confirmErrorKey) return;
    mutation.mutate({ logoName: auth.user?.username, pwd });
  };

  const handleCancel = () => {
    setPwd("");
    setPwdConfirm("");
    setSubmitted(false);
    mutation.reset();
    setSelectedMenu(null);
  };

  if (mutation.isSuccess) {
    return (
      <Box sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.8)", borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {t("setPassword.title")}
        </Typography>
        <Alert severity="success">{t("setPassword.success")}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.8)", borderRadius: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        {t("setPassword.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("setPassword.hint")}
      </Typography>
      <Stack
        component="form"
        spacing={2}
        onSubmit={handleSubmit}
        noValidate
        sx={{ maxWidth: 420 }}
      >
        <TextField
          label={t("setPassword.newPassword")}
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          error={Boolean(showPwdError)}
          helperText={showPwdError ? t(pwdErrorKey) : " "}
          autoComplete="new-password"
          autoFocus
          fullWidth
        />
        <TextField
          label={t("setPassword.confirmPassword")}
          type="password"
          value={pwdConfirm}
          onChange={(e) => setPwdConfirm(e.target.value)}
          error={Boolean(showConfirmError)}
          helperText={showConfirmError ? t(confirmErrorKey) : " "}
          autoComplete="new-password"
          fullWidth
        />

        {mutation.isError && <Alert severity="error">{t("setPassword.saveFailed")}</Alert>}

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {t("setPassword.save")}
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            {t("setPassword.cancel")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
