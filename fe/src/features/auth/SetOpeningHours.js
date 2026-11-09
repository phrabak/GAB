"use client";

import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, CircularProgress, Grid, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditNoteIcon from "@mui/icons-material/EditNote";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { locales, useTranslation } from "@/i18n/useTranslation";
import OpeningHours from "@/features/content/OpeningHours";
import { getOpeningHours, saveOpeningHours } from "@/features/content/openingHoursApi";
import { resolveBloodDraw, resolveOffices, toPayload } from "@/features/content/openingHoursData";
import { pulseOrangeFieldSx } from "@/theme/pulseOrange";

// Mirror the API's limits.
const TIME_MAX = 50;
const SERVICE_MAX = 1000;

// Same light silver as the day area; white while editing.
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
function OpeningHoursEditor({ initial, initialBloodDraw, locale, onSave }) {
  const { t } = useTranslation();
  const [offices, setOffices] = useState(initial);
  const [bloodDraw, setBloodDraw] = useState(initialBloodDraw);
  // Row awaiting delete confirmation: { officeId, dayKey, index } or { blood: true, index }; null closes the dialog.
  const [pendingDelete, setPendingDelete] = useState(null);

  // Refs let the unmount cleanup save the latest values.
  const officesRef = useRef(offices);
  officesRef.current = offices;
  const bloodDrawRef = useRef(bloodDraw);
  bloodDrawRef.current = bloodDraw;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(JSON.stringify(toPayload(initial, locale, initialBloodDraw)));

  const persist = (list = officesRef.current, drawn = bloodDrawRef.current) => {
    const payload = toPayload(list, locale, drawn);
    const json = JSON.stringify(payload);
    if (json === savedRef.current) return;
    savedRef.current = json;
    onSaveRef.current(payload);
  };

  useEffect(() => () => persist(), []);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) persist();
  };

  const setRow = (officeId, dayKey, rowIndex, field, value) =>
    setOffices((prev) =>
      prev.map((office) =>
        office.id !== officeId
          ? office
          : {
              ...office,
              days: office.days.map((day) =>
                day.key !== dayKey
                  ? day
                  : { ...day, rows: day.rows.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row)) }
              ),
            }
      )
    );

  // Blank texts for every language keep the new row from picking up a default text; it is saved on blur.
  const addRow = (officeId, dayKey) =>
    setOffices((prev) =>
      prev.map((office) =>
        office.id !== officeId
          ? office
          : {
              ...office,
              days: office.days.map((day) =>
                day.key !== dayKey
                  ? day
                  : {
                      ...day,
                      rows: [
                        ...day.rows,
                        { time: "", service: "", services: Object.fromEntries(locales.map(({ code }) => [code, ""])), isNew: true },
                      ],
                    }
              ),
            }
      )
    );

  // A removed row cannot fire blur, so deleting saves right away.
  const removeRow = (officeId, dayKey, rowIndex) => {
    const next = offices.map((office) =>
      office.id !== officeId
        ? office
        : {
            ...office,
            days: office.days.map((day) =>
              day.key !== dayKey ? day : { ...day, rows: day.rows.filter((_, i) => i !== rowIndex) }
            ),
          }
    );
    setOffices(next);
    persist(next);
  };

  const setNotice = (value) => setBloodDraw((prev) => ({ ...prev, notice: value }));
  const setBloodRow = (index, field, value) =>
    setBloodDraw((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  const addBloodRow = () => {
    const blank = () => Object.fromEntries(locales.map(({ code }) => [code, ""]));
    setBloodDraw((prev) => ({
      ...prev,
      rows: [...prev.rows, { day: "", time: "", days: blank(), times: blank(), isNew: true }],
    }));
  };
  const removeBloodRow = (index) => {
    const next = { ...bloodDraw, rows: bloodDraw.rows.filter((_, i) => i !== index) };
    setBloodDraw(next);
    persist(officesRef.current, next);
  };

  const pendingName = (() => {
    if (!pendingDelete) return "";
    if (pendingDelete.blood) {
      const row = bloodDraw.rows[pendingDelete.index];
      return [row?.day, row?.time].filter(Boolean).join(" ");
    }
    const day = offices.find((o) => o.id === pendingDelete.officeId)?.days.find((d) => d.key === pendingDelete.dayKey);
    const row = day?.rows[pendingDelete.index];
    return [day?.label, row?.time, row?.service].filter(Boolean).join(" ");
  })();

  const confirmDelete = () => {
    if (pendingDelete.blood) removeBloodRow(pendingDelete.index);
    else removeRow(pendingDelete.officeId, pendingDelete.dayKey, pendingDelete.index);
    setPendingDelete(null);
  };

  return (
    <Grid container spacing={3} onBlur={handleBlur}>
      {offices.map((office) => (
        <Grid key={office.id} size={{ xs: 12, md: 6 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {t(`openingHours.office${office.id}`)}
          </Typography>
          {office.days.map((day) => (
            <Stack
              key={day.key}
              direction="row"
              spacing={1}
              sx={{
                alignItems: "flex-start",
                p: 1,
                borderRadius: 1,
                bgcolor: "#eeeeee",
              }}
            >
              <Stack sx={{ width: 40, flexShrink: 0, alignItems: "flex-start" }}>
                <Typography sx={{ mt: 1, fontWeight: 500, color: "text.secondary" }}>{day.label}</Typography>
                <Tooltip title={t("setOpeningHours.addRow")}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => addRow(office.id, day.key)}
                    aria-label={t("setOpeningHours.addRow")}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack spacing={1} sx={{ flexGrow: 1 }}>
                {day.rows.map((row, index) => (
                  <Stack key={index} direction="row" spacing={1}>
                    <TextField
                      label={t("openingHours.time")}
                      value={row.time}
                      onChange={(e) => setRow(office.id, day.key, index, "time", e.target.value)}
                      slotProps={{ htmlInput: { maxLength: TIME_MAX } }}
                      size="small"
                      // Fields of a row added in this session keep pulsing until they are filled in.
                      sx={[inputSx, { width: { xs: 100, sm: 130 }, flexShrink: 0 }, row.isNew && !row.time.trim() && pulseOrangeFieldSx]}
                    />
                    <TextField
                      label={t("openingHours.service")}
                      value={row.service}
                      onChange={(e) => setRow(office.id, day.key, index, "service", e.target.value)}
                      slotProps={{ htmlInput: { maxLength: SERVICE_MAX } }}
                      fullWidth
                      size="small"
                      sx={[inputSx, row.isNew && !row.service.trim() && pulseOrangeFieldSx]}
                    />
                    <Tooltip title={t("setOpeningHours.deleteRow")}>
                      <IconButton
                        color="error"
                        onClick={() => setPendingDelete({ officeId: office.id, dayKey: day.key, index })}
                        aria-label={t("setOpeningHours.deleteRow")}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
        </Grid>
      ))}
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {t("setOpeningHours.bloodDrawTitle")}
          </Typography>
          <Stack spacing={1} sx={{ p: 1, borderRadius: 1, bgcolor: "#eeeeee" }}>
            <TextField
              label={t("setOpeningHours.notice")}
              value={bloodDraw.notice}
              onChange={(e) => setNotice(e.target.value)}
              slotProps={{ htmlInput: { maxLength: SERVICE_MAX } }}
              multiline
              fullWidth
              size="small"
              sx={inputSx}
            />
            {bloodDraw.rows.map((row, index) => (
              <Stack key={index} direction="row" spacing={1}>
                <TextField
                  label={t("openingHours.day")}
                  value={row.day}
                  onChange={(e) => setBloodRow(index, "day", e.target.value)}
                  slotProps={{ htmlInput: { maxLength: TIME_MAX } }}
                  size="small"
                  fullWidth
                  sx={[inputSx, row.isNew && !row.day.trim() && pulseOrangeFieldSx]}
                />
                <TextField
                  label={t("openingHours.time")}
                  value={row.time}
                  onChange={(e) => setBloodRow(index, "time", e.target.value)}
                  slotProps={{ htmlInput: { maxLength: TIME_MAX } }}
                  size="small"
                  fullWidth
                  sx={[inputSx, row.isNew && !row.time.trim() && pulseOrangeFieldSx]}
                />
                <Tooltip title={t("setOpeningHours.deleteRow")}>
                  <IconButton
                    color="error"
                    onClick={() => setPendingDelete({ blood: true, index })}
                    aria-label={t("setOpeningHours.deleteRow")}
                  >
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
            <Stack direction="row">
              <Tooltip title={t("setOpeningHours.addRow")}>
                <IconButton size="small" color="primary" onClick={addBloodRow} aria-label={t("setOpeningHours.addRow")}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Grid>
      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={t("setOpeningHours.deleteRow")}
        text={t("setOpeningHours.deleteRowConfirm")}
        name={pendingName}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </Grid>
  );
}

export default function SetOpeningHours() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);

  const { data: stored, isPending, isError: loadError } = useQuery({
    queryKey: ["openingHours"],
    queryFn: getOpeningHours,
  });

  const mutation = useMutation({
    mutationFn: saveOpeningHours,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["openingHours"] });
      queryClient.setQueryData(["openingHours"], next);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["openingHours"] }),
  });

  return (
    <>
    <Tooltip title={t(preview ? "setOpeningHours.backToEdit" : "setOpeningHours.showPreview")} placement="right">
      <IconButton
        key={preview ? "edit" : "preview"}
        onClick={() => setPreview((value) => !value)}
        aria-label={t(preview ? "setOpeningHours.backToEdit" : "setOpeningHours.showPreview")}
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
        <OpeningHours />
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
        {t("setOpeningHours.title")}
      </Typography>

      <Stack spacing={1}>
        {isPending ? (
          <CircularProgress size={24} />
        ) : (
          <OpeningHoursEditor
            key={locale}
            initial={resolveOffices(stored, locale, t)}
            initialBloodDraw={resolveBloodDraw(stored, locale)}
            locale={locale}
            onSave={(payload) => mutation.mutate(payload)}
          />
        )}
        {loadError && <Alert severity="error">{t("setOpeningHours.loadFailed")}</Alert>}
        {mutation.isError && <Alert severity="error">{t("setOpeningHours.saveFailed")}</Alert>}
      </Stack>
    </Box>
    </>
  );
}
