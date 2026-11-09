"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from "@mui/material";
import { useTranslation } from "@/i18n/useTranslation";

export default function ConfirmDeleteDialog({ open, title, text, name, onCancel, onConfirm }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
        {name && <Typography sx={{ mt: 1, fontWeight: 600, wordBreak: "break-word" }}>{name}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t("settings.cancel")}</Button>
        <Button variant="contained" color="error" onClick={onConfirm} autoFocus>
          {t("settings.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
