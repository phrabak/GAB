"use client";

import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditNoteIcon from "@mui/icons-material/EditNote";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { locales, useTranslation } from "@/i18n/useTranslation";
import Services from "@/features/content/Services";
import { getPreventiveCheckups, savePreventiveCheckups } from "@/features/content/preventiveCheckupsApi";
import { resolvePreventiveCheckups, toPayload } from "@/features/content/preventiveCheckupsData";
import { pulseOrangeFieldSx } from "@/theme/pulseOrange";

// Mirror the API's limits.
const TEXT_MAX = 1000;
const MAX_ROWS = 50;

// Same light silver as the area behind; white while editing.
const inputSx = {
  "& .MuiOutlinedInput-root": { bgcolor: "#eeeeee", "&.Mui-focused": { bgcolor: "#ffffff" } },
};

const reveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.35); }
  50% { transform: scale(1.12); box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
`;

// Changes are saved when focus leaves the editor or the page closes.
function PreventiveCheckupsEditor({ initial, locale, onSave }) {
  const { t } = useTranslation();
  const [checkups, setCheckups] = useState(initial);
  // Index of the row awaiting delete confirmation; null means the dialog is closed.
  const [deleteIndex, setDeleteIndex] = useState(null);

  // Refs let the unmount cleanup save the latest values.
  const checkupsRef = useRef(checkups);
  checkupsRef.current = checkups;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(JSON.stringify(toPayload(initial, locale)));

  const persist = (value = checkupsRef.current) => {
    const payload = toPayload(value, locale);
    const json = JSON.stringify(payload);
    if (json === savedRef.current) return;
    savedRef.current = json;
    onSaveRef.current(payload);
  };

  useEffect(() => () => persist(), []);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) persist();
  };

  const setField = (field) => (event) => setCheckups((prev) => ({ ...prev, [field]: event.target.value }));
  const setRow = (index, value) =>
    setCheckups((prev) => ({ ...prev, rows: prev.rows.map((row, i) => (i === index ? { ...row, text: value } : row)) }));

  // Blank texts for every language keep the new row from picking up a default text; it is saved on blur.
  const addRow = () =>
    setCheckups((prev) => ({
      ...prev,
      rows: [...prev.rows, { text: "", texts: Object.fromEntries(locales.map(({ code }) => [code, ""])), isNew: true }],
    }));

  // A removed row cannot fire blur, so deleting saves right away.
  const removeRow = (index) => {
    const next = { ...checkups, rows: checkups.rows.filter((_, i) => i !== index) };
    setCheckups(next);
    persist(next);
  };

  return (
    <Stack spacing={1} onBlur={handleBlur} sx={{ p: 1, borderRadius: 1, bgcolor: "#eeeeee" }}>
      <TextField
        label={t("setPreventiveCheckups.titleLabel")}
        value={checkups.title}
        onChange={setField("title")}
        slotProps={{ htmlInput: { maxLength: TEXT_MAX } }}
        fullWidth
        size="small"
        sx={inputSx}
      />
      <TextField
        label={t("setPreventiveCheckups.columnLabel")}
        value={checkups.columnLabel}
        onChange={setField("columnLabel")}
        slotProps={{ htmlInput: { maxLength: TEXT_MAX } }}
        fullWidth
        size="small"
        sx={inputSx}
      />
      {checkups.rows.map((row, index) => (
        <Stack key={index} direction="row" spacing={1}>
          <TextField
            label={t("setPreventiveCheckups.rowLabel")}
            value={row.text}
            onChange={(e) => setRow(index, e.target.value)}
            slotProps={{ htmlInput: { maxLength: TEXT_MAX } }}
            fullWidth
            size="small"
            // A field of a row added in this session keeps pulsing until it is filled in.
            sx={[inputSx, row.isNew && !row.text.trim() && pulseOrangeFieldSx]}
          />
          <Tooltip title={t("setPreventiveCheckups.deleteRow")}>
            <IconButton
              color="error"
              onClick={() => setDeleteIndex(index)}
              aria-label={t("setPreventiveCheckups.deleteRow")}
            >
              <DeleteOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ))}
      <Stack direction="row">
        <Tooltip title={t("setPreventiveCheckups.addRow")}>
          <span>
            <IconButton
              size="small"
              color="primary"
              disabled={checkups.rows.length >= MAX_ROWS}
              onClick={addRow}
              aria-label={t("setPreventiveCheckups.addRow")}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <ConfirmDeleteDialog
        open={deleteIndex !== null}
        title={t("setPreventiveCheckups.deleteRow")}
        text={t("setPreventiveCheckups.deleteRowConfirm")}
        name={deleteIndex !== null ? checkups.rows[deleteIndex]?.text : ""}
        onCancel={() => setDeleteIndex(null)}
        onConfirm={() => {
          removeRow(deleteIndex);
          setDeleteIndex(null);
        }}
      />
    </Stack>
  );
}

export default function SetPreventiveCheckups() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);

  const { data: stored, isPending, isError: loadError } = useQuery({
    queryKey: ["preventiveCheckups"],
    queryFn: getPreventiveCheckups,
  });

  const mutation = useMutation({
    mutationFn: savePreventiveCheckups,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["preventiveCheckups"] });
      queryClient.setQueryData(["preventiveCheckups"], next);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["preventiveCheckups"] }),
  });

  return (
    <>
      <Tooltip
        title={t(preview ? "setPreventiveCheckups.backToEdit" : "setPreventiveCheckups.showPreview")}
        placement="right"
      >
        <IconButton
          key={preview ? "edit" : "preview"}
          onClick={() => setPreview((value) => !value)}
          aria-label={t(preview ? "setPreventiveCheckups.backToEdit" : "setPreventiveCheckups.showPreview")}
          sx={{
            position: "fixed",
            top: { xs: "auto", md: 80 },
            bottom: { xs: 16, md: "auto" },
            left: 16,
            zIndex: "speedDial",
            color: "common.white",
            bgcolor: preview ? "secondary.main" : "primary.main",
            animation: `${pulse} 1.6s ease-in-out infinite`,
            "&:hover": { bgcolor: preview ? "secondary.dark" : "primary.dark" },
          }}
        >
          {preview ? <EditNoteIcon /> : <VisibilityIcon />}
        </IconButton>
      </Tooltip>
      {preview && (
        <Box sx={{ animation: `${reveal} 0.6s ease-out` }}>
          <Services initialTab="preventiveCheckups" />
        </Box>
      )}
      <Box
        sx={{
          display: preview ? "none" : "block",
          // Restarts each time display switches back from none.
          animation: `${reveal} 0.6s ease-out`,
          p: 2,
          mx: { md: "-10%" },
          bgcolor: "rgba(255, 255, 255, 0.8)",
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          {t("setPreventiveCheckups.title")}
        </Typography>

        <Stack spacing={1}>
          {isPending ? (
            <CircularProgress size={24} />
          ) : (
            <PreventiveCheckupsEditor
              key={locale}
              initial={resolvePreventiveCheckups(stored, locale)}
              locale={locale}
              onSave={(payload) => mutation.mutate(payload)}
            />
          )}
          {loadError && <Alert severity="error">{t("setPreventiveCheckups.loadFailed")}</Alert>}
          {mutation.isError && <Alert severity="error">{t("setPreventiveCheckups.saveFailed")}</Alert>}
        </Stack>
      </Box>
    </>
  );
}
