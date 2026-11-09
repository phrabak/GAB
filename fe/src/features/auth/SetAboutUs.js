"use client";

import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditNoteIcon from "@mui/icons-material/EditNote";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { useTranslation } from "@/i18n/useTranslation";
import { getSettings, saveSettings } from "@/features/auth/settingsApi";
import AboutUs from "@/features/content/AboutUs";
import { DEFAULT_TEAM, displayName, initials } from "@/features/content/teamData";
import { pulseOrangeFieldSx } from "@/theme/pulseOrange";

// Mirrors the API's limit for one service text.
const SERVICE_MAX = 1000;
// Mirrors the API's limit for a team member's name.
const NAME_MAX = 100;

const ROLES = {
  doctor: { accent: "primary", light: "#81d4fa", icon: <MedicalServicesRoundedIcon />, labelKey: "about.doctor" },
  nurse: { accent: "secondary", light: "#a5d6a7", icon: <ChildCareRoundedIcon />, labelKey: "about.nurse" },
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

const focusedWhite = { "& .MuiOutlinedInput-root.Mui-focused": { bgcolor: "#ffffff" } };

const clean = (list) => list.map((text) => text.trim()).filter(Boolean);

const toStored = ({ role, firstName, lastName }) => ({
  role,
  firstName: firstName.trim(),
  lastName: lastName.trim(),
});

// Members without any name are dropped.
const cleanTeam = (list) => list.map(toStored).filter((member) => member.firstName || member.lastName);

// Edits the doctor and nurse boxes of the About Us page; changes are saved when focus leaves the editor or the page closes.
function TeamEditor({ initial, onSave }) {
  const { t } = useTranslation();
  const nextId = useRef(0);
  const [items, setItems] = useState(() => initial.map((member) => ({ ...member, id: nextId.current++ })));
  const [menuAnchor, setMenuAnchor] = useState(null);
  // Id of the member awaiting delete confirmation; null means the dialog is closed.
  const [deleteId, setDeleteId] = useState(null);
  const memberToDelete = items.find((member) => member.id === deleteId);
  // Drag-and-drop state: the card being dragged and the card it is currently over.
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  // Refs let the unmount cleanup save the latest list.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(JSON.stringify(cleanTeam(initial)));

  const persist = (list) => {
    const cleaned = cleanTeam(list);
    const json = JSON.stringify(cleaned);
    if (json === savedRef.current) return;
    savedRef.current = json;
    onSaveRef.current(cleaned);
  };

  useEffect(() => () => persist(itemsRef.current), []);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) persist(itemsRef.current);
  };

  const setName = (id, field, value) =>
    setItems((prev) => prev.map((member) => (member.id === id ? { ...member, [field]: value } : member)));

  // A removed card cannot fire blur, so deleting saves right away.
  const removeMember = (id) => {
    const next = items.filter((member) => member.id !== id);
    setItems(next);
    persist(next);
  };

  // Moving saves right away, like deleting.
  const moveMember = (from, to) => {
    const next = [...items];
    next.splice(to, 0, ...next.splice(from, 1));
    setItems(next);
    persist(next);
  };

  const clearDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  // Only the handle is draggable, so text inside the fields stays selectable.
  const handleDragStart = (index) => (event) => {
    event.dataTransfer.effectAllowed = "move";
    // Firefox requires data to be set for the drag to start.
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.setDragImage(event.currentTarget.parentElement, 0, 0);
    setDragIndex(index);
  };

  const handleDragOver = (index) => (event) => {
    if (dragIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDrop = (index) => (event) => {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) moveMember(dragIndex, index);
    clearDrag();
  };

  // New doctors go after the last doctor and new nurses at the end; the order can then be changed by dragging.
  const addMember = (role) => {
    setMenuAnchor(null);
    setItems((prev) => {
      const next = [...prev];
      const entry = { id: nextId.current++, role, firstName: "", lastName: "", isNew: true };
      if (role === "doctor") next.splice(prev.findLastIndex((member) => member.role === "doctor") + 1, 0, entry);
      else next.push(entry);
      return next;
    });
  };

  return (
    <Stack spacing={1.5} onBlur={handleBlur}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <LocalHospitalRoundedIcon sx={{ color: "red" }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          {t("about.team")}
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        {items.map((member, index) => {
          const { accent, light, icon, labelKey } = ROLES[member.role];
          // Name fields of a box added in this session keep pulsing until they are filled in.
          const pulseFirst = member.isNew && !member.firstName.trim();
          const pulseLast = member.isNew && !member.lastName.trim();
          return (
            <Grid key={member.id} size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper
                variant="outlined"
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                sx={{
                  position: "relative",
                  p: 2.5,
                  height: "100%",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 1.5,
                  borderColor: light,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  bgcolor: "#eeeeee",
                  opacity: dragIndex === index ? 0.4 : 1,
                  // Marks the drop position with a bar on the left edge.
                  boxShadow:
                    dragIndex !== null && overIndex === index && dragIndex !== index
                      ? (theme) => `-6px 0 0 0 ${theme.palette.primary.main}`
                      : "none",
                }}
              >
                <Box
                  draggable
                  onDragStart={handleDragStart(index)}
                  onDragEnd={clearDrag}
                  aria-label={t("settings.moveMember")}
                  title={t("settings.moveMember")}
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    display: "flex",
                    cursor: "grab",
                    color: "action.active",
                    "&:active": { cursor: "grabbing" },
                  }}
                >
                  <DragIndicatorIcon />
                </Box>
                <Tooltip title={t("settings.deleteMember")}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteId(member.id)}
                    aria-label={t("settings.deleteMember")}
                    sx={{ position: "absolute", top: 4, right: 4 }}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Avatar sx={{ width: 56, height: 56, bgcolor: light, color: "text.primary", fontSize: "1.2rem", fontWeight: 600 }}>
                  {initials(displayName(member))}
                </Avatar>
                <TextField
                  label={t("settings.firstName")}
                  value={member.firstName}
                  onChange={(e) => setName(member.id, "firstName", e.target.value)}
                  slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
                  fullWidth
                  size="small"
                  sx={[focusedWhite, pulseFirst && pulseOrangeFieldSx]}
                />
                <TextField
                  label={t("settings.lastName")}
                  value={member.lastName}
                  onChange={(e) => setName(member.id, "lastName", e.target.value)}
                  slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
                  fullWidth
                  size="small"
                  sx={[focusedWhite, pulseLast && pulseOrangeFieldSx]}
                />
                <Chip icon={icon} label={t(labelKey)} color={accent} variant="outlined" size="small" />
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      <Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<AddIcon />} onClick={(e) => setMenuAnchor(e.currentTarget)}>
          {t("settings.addMember")}
        </Button>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => addMember("doctor")}>{t("about.doctor")}</MenuItem>
          <MenuItem onClick={() => addMember("nurse")}>{t("about.nurse")}</MenuItem>
        </Menu>
      </Stack>
      <ConfirmDeleteDialog
        open={Boolean(memberToDelete)}
        title={t("settings.deleteMember")}
        text={t("settings.deleteMemberConfirm")}
        name={memberToDelete ? displayName(memberToDelete) : ""}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          removeMember(deleteId);
          setDeleteId(null);
        }}
      />
    </Stack>
  );
}

// Edits the services of the current language; changes are saved when focus leaves the editor or the page closes.
// Saving an empty list falls back to the built-in texts.
function ServicesEditor({ initial, onSave }) {
  const { t } = useTranslation();
  const nextId = useRef(0);
  const [items, setItems] = useState(() => initial.map((text) => ({ id: nextId.current++, text })));
  // Drag-and-drop state: the row being dragged and the row it is currently over.
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  // Id of the row awaiting delete confirmation; null means the dialog is closed.
  const [deleteId, setDeleteId] = useState(null);
  const itemToDelete = items.find((item) => item.id === deleteId);

  // Refs let the unmount cleanup save the latest list.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const savedRef = useRef(JSON.stringify(initial));

  const persist = (list) => {
    const cleaned = clean(list.map((item) => item.text));
    const json = JSON.stringify(cleaned);
    if (json === savedRef.current) return;
    savedRef.current = json;
    onSaveRef.current(cleaned);
  };

  useEffect(() => () => persist(itemsRef.current), []);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) persist(itemsRef.current);
  };

  const setItem = (index, value) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, text: value } : item)));
  // A removed row cannot fire blur, so deleting and moving save right away.
  const removeItem = (index) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    persist(next);
  };
  const moveItem = (from, to) => {
    const next = [...items];
    next.splice(to, 0, ...next.splice(from, 1));
    setItems(next);
    persist(next);
  };

  const clearDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  // Only the handle is draggable, so text inside the fields stays selectable.
  const handleDragStart = (index) => (event) => {
    event.dataTransfer.effectAllowed = "move";
    // Firefox requires data to be set for the drag to start.
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.setDragImage(event.currentTarget.parentElement, 0, 0);
    setDragIndex(index);
  };

  const handleDragOver = (index) => (event) => {
    if (dragIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDrop = (index) => (event) => {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) moveItem(dragIndex, index);
    clearDrag();
  };

  return (
    <Stack spacing={1.5} onBlur={handleBlur}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
        {t("settings.servicesTitle")}
      </Typography>
      {items.map((item, index) => (
        <Stack
          key={item.id}
          direction="row"
          spacing={1}
          onDragOver={handleDragOver(index)}
          onDrop={handleDrop(index)}
          sx={{
            alignItems: "flex-start",
            opacity: dragIndex === index ? 0.4 : 1,
            borderTop: "2px solid",
            borderColor: dragIndex !== null && overIndex === index && dragIndex !== index ? "primary.main" : "transparent",
          }}
        >
          <Box
            draggable
            onDragStart={handleDragStart(index)}
            onDragEnd={clearDrag}
            aria-label={t("settings.moveService")}
            sx={{ mt: 1, display: "flex", cursor: "grab", color: "action.active", "&:active": { cursor: "grabbing" } }}
          >
            <DragIndicatorIcon />
          </Box>
          <TextField
            label={t("settings.serviceLabel")}
            value={item.text}
            onChange={(e) => setItem(index, e.target.value)}
            slotProps={{ htmlInput: { maxLength: SERVICE_MAX } }}
            multiline
            fullWidth
            size="small"
            // A field of a row added in this session keeps pulsing until it is filled in.
            sx={[focusedWhite, item.isNew && !item.text.trim() && pulseOrangeFieldSx]}
          />
          <Tooltip title={t("settings.deleteService")}>
            <IconButton color="error" onClick={() => setDeleteId(item.id)} aria-label={t("settings.deleteService")}>
              <DeleteOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ))}
      <Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setItems((prev) => [...prev, { id: nextId.current++, text: "", isNew: true }])}>
          {t("settings.addService")}
        </Button>
      </Stack>
      <ConfirmDeleteDialog
        open={Boolean(itemToDelete)}
        title={t("settings.deleteService")}
        text={t("settings.deleteServiceConfirm")}
        name={itemToDelete?.text ?? ""}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          removeItem(items.findIndex((item) => item.id === deleteId));
          setDeleteId(null);
        }}
      />
    </Stack>
  );
}

export default function SetAboutUs() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const defaultServices = t("about.services");
  const [preview, setPreview] = useState(false);

  const { data: settings, isPending, isError: loadError } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const mutation = useMutation({
    mutationFn: saveSettings,
    // Saves rewrite the whole document, so they must run one at a time.
    scope: { id: "settings-save" },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  // Applies the change on top of the latest cached settings, so the saves of separate editors never overwrite each other.
  const save = (change) => {
    const current = queryClient.getQueryData(["settings"]);
    const next = { ...current, ...(typeof change === "function" ? change(current) : change) };
    queryClient.setQueryData(["settings"], next);
    mutation.mutate(next);
  };

  return (
    <>
    <Tooltip title={t(preview ? "settings.backToEdit" : "settings.showPreview")} placement="right">
      <IconButton
        key={preview ? "edit" : "preview"}
        onClick={() => setPreview((value) => !value)}
        aria-label={t(preview ? "settings.backToEdit" : "settings.showPreview")}
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
        <AboutUs />
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
        {t("settings.title")}
      </Typography>

      <Stack spacing={1}>
        {isPending ? (
          <CircularProgress size={24} />
        ) : (
          settings && (
            <>
              <TeamEditor initial={settings.team ?? DEFAULT_TEAM} onSave={(team) => save({ team })} />
              <Divider sx={{ my: 1 }} />
              <ServicesEditor
                key={locale}
                initial={settings.services?.[locale]?.length ? settings.services[locale] : defaultServices}
                onSave={(list) => save((current) => ({ services: { ...current.services, [locale]: list } }))}
              />
            </>
          )
        )}
        {loadError && <Alert severity="error">{t("settings.loadFailed")}</Alert>}
        {mutation.isError && <Alert severity="error">{t("settings.saveFailed")}</Alert>}
      </Stack>
    </Box>
    </>
  );
}
