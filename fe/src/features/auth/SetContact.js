"use client";

import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Avatar, Box, CircularProgress, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import FacebookIcon from "@mui/icons-material/Facebook";
import EditNoteIcon from "@mui/icons-material/EditNote";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { useTranslation } from "@/i18n/useTranslation";
import Contact from "@/features/content/Contact";
import { getContacts, saveContacts } from "@/features/content/contactsApi";
import { resolveContacts, toPayload } from "@/features/content/contactsData";
import { pulseOrangeFieldSx } from "@/theme/pulseOrange";

// Mirror the API's limits.
const TEXT_MAX = 200;
const MAX_DOCTORS = 10;

// Transparent over the editor background; white while editing.
const inputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: 2 },
  "& .MuiOutlinedInput-root.Mui-focused": { bgcolor: "#ffffff" },
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

const FIELDS = [
  { key: "phone", labelKey: "setContact.phone", icon: <PhoneIcon color="primary" />, type: "tel" },
  { key: "email", labelKey: "setContact.email", icon: <EmailIcon color="primary" />, type: "email" },
  { key: "dataBox", labelKey: "setContact.dataBox", icon: <MarkEmailReadIcon color="primary" /> },
  { key: "facebook", labelKey: "setContact.facebook", icon: <FacebookIcon sx={{ color: "#1877F2" }} />, type: "url" },
];

// Changes are saved when focus leaves the editor or the page closes.
function ContactsEditor({ initial, onSave }) {
  const { t } = useTranslation();
  const nextId = useRef(0);
  const [practices, setPractices] = useState(() =>
    initial.map((practice) => ({
      ...practice,
      doctors: practice.doctors.map((text) => ({ id: nextId.current++, text })),
    }))
  );
  // Doctor awaiting delete confirmation; null means the dialog is closed.
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Refs let the unmount cleanup save the latest values.
  const practicesRef = useRef(practices);
  practicesRef.current = practices;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(JSON.stringify(toPayload(practices)));

  const persist = (value = practicesRef.current) => {
    const payload = toPayload(value);
    const json = JSON.stringify(payload);
    if (json === savedRef.current) return;
    savedRef.current = json;
    onSaveRef.current(payload);
  };

  useEffect(() => () => persist(), []);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) persist();
  };

  const updatePractice = (index, change) =>
    setPractices((prev) => prev.map((practice, i) => (i === index ? change(practice) : practice)));

  const setField = (index, key) => (event) =>
    updatePractice(index, (practice) => ({ ...practice, [key]: event.target.value }));

  const setDoctor = (index, id, text) =>
    updatePractice(index, (practice) => ({
      ...practice,
      doctors: practice.doctors.map((doctor) => (doctor.id === id ? { ...doctor, text } : doctor)),
    }));

  const addDoctor = (index) =>
    updatePractice(index, (practice) => ({
      ...practice,
      doctors: [...practice.doctors, { id: nextId.current++, text: "", isNew: true }],
    }));

  // A removed row cannot fire blur, so deleting saves right away.
  const removeDoctor = ({ index, id }) => {
    const next = practices.map((practice, i) =>
      i === index ? { ...practice, doctors: practice.doctors.filter((doctor) => doctor.id !== id) } : practice
    );
    setPractices(next);
    persist(next);
  };

  const deletedName = deleteTarget
    ? practices[deleteTarget.index].doctors.find((doctor) => doctor.id === deleteTarget.id)?.text
    : "";

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} onBlur={handleBlur}>
      {practices.map((practice, index) => {
        const accent = index === 0 ? "primary" : "secondary";
        return (
          <Paper
            key={index}
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              bgcolor: "#eeeeee",
              borderTop: "4px solid",
              borderColor: `${accent}.main`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar sx={{ bgcolor: `${accent}.main`, width: 40, height: 40 }}>
                  <LocalHospitalRoundedIcon />
                </Avatar>
                <Typography variant="h6" component="h3" sx={{ flexGrow: 1, fontWeight: 600 }}>
                  {t(`contact.ordination${index + 1}`)}
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 2 }}>
                    {t("setContact.doctors")}
                  </Typography>
                  <Tooltip title={t("setContact.addDoctor")}>
                    <span>
                      <IconButton
                        size="small"
                        color={accent}
                        disabled={practice.doctors.length >= MAX_DOCTORS}
                        onClick={() => addDoctor(index)}
                        aria-label={t("setContact.addDoctor")}
                        sx={{ bgcolor: "rgba(255,255,255,0.7)", "&:hover": { bgcolor: "#ffffff" } }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>

                {practice.doctors.map((doctor) => (
                  <Stack key={doctor.id} direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <TextField
                      label={t("setContact.doctor")}
                      value={doctor.text}
                      onChange={(e) => setDoctor(index, doctor.id, e.target.value)}
                      slotProps={{
                        htmlInput: { maxLength: TEXT_MAX },
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlinedIcon color={accent} />
                            </InputAdornment>
                          ),
                        },
                      }}
                      fullWidth
                      size="small"
                      // A doctor added in this session keeps pulsing until a name is filled in.
                      sx={[inputSx, doctor.isNew && !doctor.text.trim() && pulseOrangeFieldSx]}
                    />
                    <Tooltip title={t("setContact.deleteDoctor")}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteTarget({ index, id: doctor.id })}
                        aria-label={t("setContact.deleteDoctor")}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 2 }}>
                  {t("setContact.contactDetails")}
                </Typography>
                {FIELDS.map(({ key, labelKey, icon, type }) => (
                  <TextField
                    key={key}
                    label={t(labelKey)}
                    type={type}
                    value={practice[key]}
                    onChange={setField(index, key)}
                    slotProps={{
                      htmlInput: { maxLength: TEXT_MAX },
                      input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
                    }}
                    fullWidth
                    size="small"
                    sx={inputSx}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title={t("setContact.deleteDoctor")}
        text={t("setContact.deleteDoctorConfirm")}
        name={deletedName}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          removeDoctor(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </Stack>
  );
}

export default function SetContact() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(false);

  const { data: stored, isPending, isError: loadError } = useQuery({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const mutation = useMutation({
    mutationFn: saveContacts,
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ["contacts"] });
      queryClient.setQueryData(["contacts"], next);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });

  return (
    <>
      <Tooltip title={t(preview ? "setContact.backToEdit" : "setContact.showPreview")} placement="right">
        <IconButton
          key={preview ? "edit" : "preview"}
          onClick={() => setPreview((value) => !value)}
          aria-label={t(preview ? "setContact.backToEdit" : "setContact.showPreview")}
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
          <Contact />
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
          {t("setContact.title")}
        </Typography>

        <Stack spacing={1}>
          {isPending ? (
            <CircularProgress size={24} />
          ) : (
            <ContactsEditor initial={resolveContacts(stored, t)} onSave={(payload) => mutation.mutate(payload)} />
          )}
          {loadError && <Alert severity="error">{t("setContact.loadFailed")}</Alert>}
          {mutation.isError && <Alert severity="error">{t("setContact.saveFailed")}</Alert>}
        </Stack>
      </Box>
    </>
  );
}
