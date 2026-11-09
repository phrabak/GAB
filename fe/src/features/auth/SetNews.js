"use client";

import { useEffect, useRef, useState } from "react";
import { keyframes } from "@emotion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import FormatPaintIcon from "@mui/icons-material/FormatPaint";
import PaletteIcon from "@mui/icons-material/Palette";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTranslation } from "@/i18n/useTranslation";
import News from "@/features/content/News";
import { deleteNewsItem, getNews, moveNewsItem, saveNewsItem, setAllNewsActive } from "@/features/content/newsApi";
import { pulseOrangeFieldSx } from "@/theme/pulseOrange";

// Limits mirror the API's NewItem validation.
const TITLE_MIN = 3;
const TITLE_MAX = 200;
const TEXT_MAX = 10000;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = "#000000";

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.35); }
  50% { transform: scale(1.12); box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
`;

const reveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;
const REVEAL_ANIMATION = `${reveal} 0.6s ease-out`;

// Named CSS (web) colors offered in the color dialog.
const WEB_COLORS = [
  ["Black", "#000000"], ["DimGray", "#696969"], ["Gray", "#808080"], ["SlateGray", "#708090"],
  ["Silver", "#c0c0c0"], ["White", "#ffffff"], ["Maroon", "#800000"], ["FireBrick", "#b22222"],
  ["Brown", "#a52a2a"], ["Crimson", "#dc143c"], ["Red", "#ff0000"], ["Tomato", "#ff6347"],
  ["OrangeRed", "#ff4500"], ["DarkOrange", "#ff8c00"], ["Orange", "#ffa500"], ["Gold", "#ffd700"],
  ["Yellow", "#ffff00"], ["Olive", "#808000"], ["GreenYellow", "#adff2f"], ["Lime", "#00ff00"],
  ["LimeGreen", "#32cd32"], ["ForestGreen", "#228b22"], ["Green", "#008000"], ["DarkGreen", "#006400"],
  ["SeaGreen", "#2e8b57"], ["Teal", "#008080"], ["Aqua", "#00ffff"], ["Turquoise", "#40e0d0"],
  ["DeepSkyBlue", "#00bfff"], ["DodgerBlue", "#1e90ff"], ["RoyalBlue", "#4169e1"], ["Blue", "#0000ff"],
  ["Navy", "#000080"], ["MidnightBlue", "#191970"], ["Indigo", "#4b0082"], ["Purple", "#800080"],
  ["DarkViolet", "#9400d3"], ["Magenta", "#ff00ff"], ["DeepPink", "#ff1493"], ["HotPink", "#ff69b4"],
  ["Pink", "#ffc0cb"], ["Sienna", "#a0522d"], ["Chocolate", "#d2691e"],
];

// Light named CSS colors for the title background, so dark title text stays readable.
const LIGHT_WEB_COLORS = [
  ["White", "#ffffff"], ["Snow", "#fffafa"], ["GhostWhite", "#f8f8ff"], ["WhiteSmoke", "#f5f5f5"],
  ["Gainsboro", "#dcdcdc"], ["LightGray", "#d3d3d3"], ["Ivory", "#fffff0"], ["FloralWhite", "#fffaf0"],
  ["OldLace", "#fdf5e6"], ["Linen", "#faf0e6"], ["AntiqueWhite", "#faebd7"], ["Beige", "#f5f5dc"],
  ["Cornsilk", "#fff8dc"], ["LightYellow", "#ffffe0"], ["LemonChiffon", "#fffacd"], ["LightGoldenrodYellow", "#fafad2"],
  ["PaleGoldenrod", "#eee8aa"], ["Wheat", "#f5deb3"], ["PapayaWhip", "#ffefd5"], ["BlanchedAlmond", "#ffebcd"],
  ["Bisque", "#ffe4c4"], ["Moccasin", "#ffe4b5"], ["PeachPuff", "#ffdab9"], ["SeaShell", "#fff5ee"],
  ["MistyRose", "#ffe4e1"], ["LavenderBlush", "#fff0f5"], ["Pink", "#ffc0cb"], ["LightPink", "#ffb6c1"],
  ["Thistle", "#d8bfd8"], ["Lavender", "#e6e6fa"], ["AliceBlue", "#f0f8ff"], ["Azure", "#f0ffff"],
  ["LightCyan", "#e0ffff"], ["PaleTurquoise", "#afeeee"], ["PowderBlue", "#b0e0e6"], ["LightBlue", "#add8e6"],
  ["LightSteelBlue", "#b0c4de"], ["Honeydew", "#f0fff0"], ["MintCream", "#f5fffa"], ["PaleGreen", "#98fb98"],
  ["LightGreen", "#90ee90"], ["LightSkyBlue", "#87cefa"],
];

// Title and panel backgrounds offer the light colors plus more saturated ones.
const PANEL_WEB_COLORS = [
  ...LIGHT_WEB_COLORS,
  ["Khaki", "#f0e68c"], ["Gold", "#ffd700"], ["Orange", "#ffa500"], ["SandyBrown", "#f4a460"],
  ["LightSalmon", "#ffa07a"], ["Salmon", "#fa8072"], ["Coral", "#ff7f50"], ["LightCoral", "#f08080"],
  ["HotPink", "#ff69b4"], ["Violet", "#ee82ee"], ["Orchid", "#da70d6"], ["Plum", "#dda0dd"],
  ["MediumPurple", "#9370db"], ["CornflowerBlue", "#6495ed"], ["SkyBlue", "#87ceeb"], ["DeepSkyBlue", "#00bfff"],
  ["Turquoise", "#40e0d0"], ["Aquamarine", "#7fffd4"], ["MediumAquamarine", "#66cdaa"], ["MediumSeaGreen", "#3cb371"],
  ["YellowGreen", "#9acd32"], ["LawnGreen", "#7cfc00"], ["GreenYellow", "#adff2f"], ["Yellow", "#ffff00"],
  ["Silver", "#c0c0c0"], ["DarkGray", "#a9a9a9"], ["Gray", "#808080"], ["LightSlateGray", "#778899"],
  ["SlateGray", "#708090"], ["DimGray", "#696969"], ["DarkSlateGray", "#2f4f4f"],
];

const PALETTES = { color: WEB_COLORS, backgroundColor: PANEL_WEB_COLORS, panelColor: PANEL_WEB_COLORS };

const EMPTY_FORM = {
  title: "",
  text: "",
  active: true,
  color: DEFAULT_COLOR,
  backgroundColor: "",
  fontBold: false,
  showLine: false,
  panelColor: "",
};

// Color dialog targets that use the light palette and allow "no background".
const BACKGROUND_TARGETS = ["backgroundColor", "panelColor"];

function toForm(item) {
  return {
    title: item.title ?? "",
    text: item.text ?? "",
    active: Boolean(item.active),
    color: item.color || DEFAULT_COLOR,
    backgroundColor: item.backgroundColor ?? "",
    fontBold: Boolean(item.fontBold),
    showLine: Boolean(item.showLine),
    panelColor: item.panelColor ?? "",
  };
}

function toPayload(form) {
  return {
    title: form.title.trim(),
    text: form.text,
    active: form.active,
    color: form.color.trim() || DEFAULT_COLOR,
    backgroundColor: form.backgroundColor,
    fontBold: form.fontBold,
    showLine: form.showLine,
    panelColor: form.panelColor,
  };
}

// The item being edited: its index (null until a new item is first saved) and its last saved payload.
function newDraft(index, form) {
  return { index, saved: index === null ? null : JSON.stringify(toPayload(form)) };
}

function validateText(value, min, max) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { key: "setNews.errorRequired" };
  if (trimmed.length < min) return { key: "setNews.errorMinLength", min };
  if (value.length > max) return { key: "setNews.errorMaxLength", max };
  return null;
}

function validate(form) {
  return {
    title: validateText(form.title, TITLE_MIN, TITLE_MAX),
    text: form.text.length > TEXT_MAX ? { key: "setNews.errorMaxLength", max: TEXT_MAX } : null,
    color: form.color !== "" && !HEX_COLOR.test(form.color) ? { key: "setNews.errorColor" } : null,
    backgroundColor:
      form.backgroundColor !== "" && !HEX_COLOR.test(form.backgroundColor) ? { key: "setNews.errorColor" } : null,
    panelColor: form.panelColor !== "" && !HEX_COLOR.test(form.panelColor) ? { key: "setNews.errorColor" } : null,
  };
}

export default function SetNews() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  // Form field edited by the color dialog; null means the dialog is closed.
  const [colorTarget, setColorTarget] = useState(null);
  const [pickerColor, setPickerColor] = useState("#000000");
  // Index of the news item being edited; null means a new item.
  const [selectedIndex, setSelectedIndex] = useState(null);
  // Index of the item awaiting delete confirmation; null means the dialog is closed.
  const [deleteIndex, setDeleteIndex] = useState(null);
  // Drag-and-drop state: the item being dragged and the row it is currently over.
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [preview, setPreview] = useState(false);
  const draftRef = useRef(newDraft(null, EMPTY_FORM));

  const { data: news = [], isPending: listPending, isError: listError } = useQuery({
    queryKey: ["news"],
    queryFn: getNews,
  });

  // Runs once, on the first loaded list, so later refreshes never override the user's selection.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || listPending) return;
    initializedRef.current = true;
    if (news.length > 0) {
      const first = toForm(news[0]);
      draftRef.current = newDraft(0, first);
      setSelectedIndex(0);
      setForm(first);
    }
  }, [listPending, news]);

  const mutation = useMutation({
    mutationFn: async ({ draft, item }) => {
      draft.index = await saveNewsItem({ item, index: draft.index });
      return draft.index;
    },
    // Saves rewrite the whole collection, so they must run one at a time.
    scope: { id: "news-save" },
    onSuccess: (savedIndex, { draft }) => {
      if (draft === draftRef.current) setSelectedIndex(savedIndex);
      return queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (_, { draft }) => {
      draft.saved = null;
    },
  });

  const activeAllMutation = useMutation({
    mutationFn: setAllNewsActive,
    scope: { id: "news-save" },
    onMutate: async (active) => {
      await queryClient.cancelQueries({ queryKey: ["news"] });
      queryClient.setQueryData(["news"], (prev = []) => prev.map((item) => ({ ...item, active })));
      setForm((prev) => ({ ...prev, active }));
      const draft = draftRef.current;
      if (draft.saved) draft.saved = JSON.stringify({ ...JSON.parse(draft.saved), active });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const allInactive = news.length > 0 && news.every((item) => !item.active);

  const errors = validate(form);

  const deleteMutation = useMutation({
    mutationFn: deleteNewsItem,
    onSuccess: (_, deletedIndex) => {
      if (deletedIndex === selectedIndex) {
        // Selects the first remaining item; the empty new-item form is only for an empty list.
        const remaining = news.filter((_, i) => i !== deletedIndex);
        if (remaining.length > 0) loadForm(0, toForm(remaining[0]));
        else loadForm(null, EMPTY_FORM);
      } else if (selectedIndex !== null && deletedIndex < selectedIndex) {
        setSelectedIndex(selectedIndex - 1);
        draftRef.current.index = selectedIndex - 1;
      }
      return queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: moveNewsItem,
    onMutate: async ({ from, to }) => {
      await queryClient.cancelQueries({ queryKey: ["news"] });
      queryClient.setQueryData(["news"], (prev = []) => {
        const next = [...prev];
        next.splice(to, 0, ...next.splice(from, 1));
        return next;
      });
      const shift = (sel) => {
        if (sel === null) return sel;
        if (sel === from) return to;
        if (from < sel && sel <= to) return sel - 1;
        if (to <= sel && sel < from) return sel + 1;
        return sel;
      };
      setSelectedIndex(shift);
      draftRef.current.index = shift(draftRef.current.index);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const clearDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragStart = (index) => (event) => {
    event.dataTransfer.effectAllowed = "move";
    // Firefox requires data to be set for the drag to start.
    event.dataTransfer.setData("text/plain", String(index));
    moveMutation.reset();
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
    if (dragIndex !== null && dragIndex !== index) {
      moveMutation.mutate({ from: dragIndex, to: index });
    }
    clearDrag();
  };

  const handleDelete = (index) => {
    deleteMutation.reset();
    setDeleteIndex(index);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteIndex);
    setDeleteIndex(null);
  };

  const save = (next) => {
    if (Object.values(validate(next)).some(Boolean)) {
      setSubmitted(true);
      return;
    }
    const item = toPayload(next);
    const json = JSON.stringify(item);
    const draft = draftRef.current;
    if (json === draft.saved) return;
    draft.saved = json;
    mutation.mutate({ draft, item });
  };

  const setField = (name) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setCheck = (name, checked) => {
    const next = { ...form, [name]: checked };
    setForm(next);
    save(next);
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    save(form);
  };

  const errorText = (name) => {
    const error = errors[name];
    if (!error || !(submitted || touched[name])) return " ";
    return t(error.key).replace("{min}", error.min).replace("{max}", error.max);
  };

  const hasError = (name) => Boolean(errors[name]) && (submitted || Boolean(touched[name]));

  const handleSubmit = (event) => {
    event.preventDefault();
    save(form);
  };

  const loadForm = (index, values) => {
    draftRef.current = newDraft(index, values);
    setSelectedIndex(index);
    setForm(values);
    setTouched({});
    setSubmitted(false);
    mutation.reset();
  };

  const selectItem = (index) => loadForm(index, toForm(news[index]));

  const startNew = () => loadForm(null, EMPTY_FORM);

  const openColorDialog = (target) => () => {
    setPickerColor(
      HEX_COLOR.test(form[target]) ? form[target] : BACKGROUND_TARGETS.includes(target) ? "#ffffff" : "#000000"
    );
    setColorTarget(target);
  };

  const applyColor = (value) => {
    const next = { ...form, [colorTarget]: value };
    setForm(next);
    setColorTarget(null);
    save(next);
  };

  return (
    <>
    <Tooltip title={t(preview ? "setNews.backToEdit" : "setNews.showPreview")} placement="right">
      <IconButton
        key={preview ? "edit" : "preview"}
        onClick={() => setPreview((value) => !value)}
        aria-label={t(preview ? "setNews.backToEdit" : "setNews.showPreview")}
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
      <Box sx={{ animation: REVEAL_ANIMATION }}>
        <News />
      </Box>
    )}
    <Box
      sx={{
        display: preview ? "none" : "block",
        // Restarts each time display switches back from none.
        animation: REVEAL_ANIMATION,
        p: 2,
        mx: { md: "-10%" },
        bgcolor: "rgba(255, 255, 255, 0.8)",
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        {t("setNews.title")}
      </Typography>

      <Box
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr auto 2fr" }, gap: 3, alignItems: "start" }}
      >
        <Stack component="form" spacing={1} onSubmit={handleSubmit} noValidate>
          {selectedIndex === null && <Typography variant="subtitle1">{t("setNews.newItem")}</Typography>}
          <Stack
            spacing={1}
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: HEX_COLOR.test(form.panelColor) ? form.panelColor : undefined,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
              <TextField
                label={t("setNews.titleLabel")}
                value={form.title}
                onChange={setField("title")}
                onBlur={() => handleBlur("title")}
                error={hasError("title")}
                helperText={errorText("title")}
                required
                autoFocus
                fullWidth
                sx={[
                  {
                    "& .MuiInputBase-input": { color: HEX_COLOR.test(form.color) ? form.color : undefined },
                    "& .MuiInputBase-root": {
                      bgcolor: HEX_COLOR.test(form.backgroundColor) ? form.backgroundColor : undefined,
                    },
                  },
                  // The title of a new item keeps pulsing until it is filled in.
                  selectedIndex === null && !listPending && !form.title.trim() && pulseOrangeFieldSx,
                ]}
              />
              <Tooltip title={t("setNews.chooseColor")}>
                <IconButton
                  onClick={openColorDialog("color")}
                  aria-label={t("setNews.chooseColor")}
                  color={hasError("color") ? "error" : "default"}
                  sx={{ mt: 1, flexShrink: 0 }}
                >
                  <PaletteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("setNews.chooseBackground")}>
                <IconButton
                  onClick={openColorDialog("backgroundColor")}
                  aria-label={t("setNews.chooseBackground")}
                  color={hasError("backgroundColor") ? "error" : "default"}
                  sx={{ mt: 1, flexShrink: 0 }}
                >
                  <FormatColorFillIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            <TextField
              label={t("setNews.text")}
              value={form.text}
              onChange={setField("text")}
              onBlur={() => handleBlur("text")}
              error={hasError("text")}
              helperText={errorText("text")}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
            <FormControlLabel
              control={<Checkbox checked={form.active} onChange={(e) => setCheck("active", e.target.checked)} />}
              label={t("setNews.active")}
            />
            <FormControlLabel
              control={<Checkbox checked={form.fontBold} onChange={(e) => setCheck("fontBold", e.target.checked)} />}
              label={t("setNews.fontBold")}
            />
            <FormControlLabel
              control={<Checkbox checked={form.showLine} onChange={(e) => setCheck("showLine", e.target.checked)} />}
              label={t("setNews.showLine")}
            />
            <Tooltip title={t("setNews.choosePanelBackground")}>
              <IconButton
                onClick={openColorDialog("panelColor")}
                aria-label={t("setNews.choosePanelBackground")}
                color={hasError("panelColor") ? "error" : "default"}
              >
                <FormatPaintIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {mutation.isError && <Alert severity="error">{t("setNews.saveFailed")}</Alert>}
        </Stack>

        <Divider
          orientation="vertical"
          sx={{ display: { xs: "none", md: "block" }, alignSelf: "stretch" }}
        />

        <Paper variant="outlined" sx={{ p: 1 }}>
          <Stack direction="row" sx={{ px: 1, alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1">{t("setNews.listTitle")}</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={startNew}>
              {t("setNews.newItem")}
            </Button>
          </Stack>
          {listPending && <CircularProgress size={24} sx={{ m: 1 }} />}
          {listError && <Alert severity="error">{t("setNews.listLoadFailed")}</Alert>}
          {deleteMutation.isError && <Alert severity="error">{t("setNews.deleteFailed")}</Alert>}
          {moveMutation.isError && <Alert severity="error">{t("setNews.moveFailed")}</Alert>}
          {!listPending && !listError && news.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              {t("setNews.emptyList")}
            </Typography>
          )}
          <List dense sx={{ maxHeight: 480, overflow: "auto" }}>
            {news.map((item, index) => {
              const dragging = index === dragIndex;
              const isDropTarget = dragIndex !== null && index === overIndex && !dragging;
              const canDrag = !moveMutation.isPending && !deleteMutation.isPending;
              return (
                <Stack
                  key={index}
                  direction="row"
                  draggable={canDrag}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                  onDragEnd={clearDrag}
                  sx={{
                    alignItems: "center",
                    borderRadius: 1,
                    cursor: canDrag ? "grab" : "default",
                    bgcolor: dragging ? "primary.light" : "transparent",
                    opacity: dragging ? 0.7 : 1,
                    outline: dragging ? "2px solid" : "none",
                    outlineColor: "primary.main",
                    // Indicator line on the side where the dragged item will land.
                    boxShadow: isDropTarget
                      ? (theme) => `inset 0 ${dragIndex < index ? -3 : 3}px 0 ${theme.palette.primary.main}`
                      : "none",
                  }}
                >
                  <ListItemButton selected={index === selectedIndex} onClick={() => selectItem(index)}>
                    <ListItemText primary={item.title} />
                  </ListItemButton>
                  <Tooltip title={t("setNews.delete")}>
                    <span>
                      <IconButton
                        color="error"
                        aria-label={t("setNews.delete")}
                        sx={{ ml: "5px", flexShrink: 0 }}
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDelete(index)}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              );
            })}
          </List>
          <Divider />
          <FormControlLabel
            control={
              <Checkbox
                checked={allInactive}
                disabled={news.length === 0 || activeAllMutation.isPending}
                onChange={(e) => activeAllMutation.mutate(!e.target.checked)}
              />
            }
            label={t("setNews.deactivateAll")}
            sx={{ px: 1 }}
          />
          {activeAllMutation.isError && <Alert severity="error">{t("setNews.deactivateAllFailed")}</Alert>}
        </Paper>
      </Box>

      <Dialog open={deleteIndex !== null} onClose={() => setDeleteIndex(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("setNews.deleteDialogTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("setNews.deleteConfirm")}</DialogContentText>
          <Typography sx={{ mt: 1, fontWeight: 600, wordBreak: "break-word" }}>
            {deleteIndex !== null ? news[deleteIndex]?.title : ""}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIndex(null)}>{t("setNews.cancel")}</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} autoFocus>
            {t("setNews.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={colorTarget !== null} onClose={() => setColorTarget(null)}>
        <DialogTitle>
          {t(
            colorTarget === "panelColor"
              ? "setNews.panelDialogTitle"
              : colorTarget === "backgroundColor"
                ? "setNews.backgroundDialogTitle"
                : "setNews.colorDialogTitle"
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 40px)", gap: 1, pt: 1 }}>
            {(PALETTES[colorTarget] ?? WEB_COLORS).map(([name, hex]) => {
              const selected = pickerColor.toLowerCase() === hex;
              return (
                <Box
                  key={hex}
                  component="button"
                  type="button"
                  aria-label={name}
                  aria-pressed={selected}
                  onClick={() => setPickerColor(hex)}
                  sx={{
                    width: 40,
                    height: 40,
                    p: 0,
                    bgcolor: hex,
                    borderRadius: 1,
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor: selected ? "primary.main" : "divider",
                    outline: selected ? "2px solid" : "none",
                    outlineColor: "primary.main",
                    outlineOffset: 1,
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          {BACKGROUND_TARGETS.includes(colorTarget) && (
            <Button onClick={() => applyColor("")} sx={{ mr: "auto" }}>
              {t("setNews.noBackground")}
            </Button>
          )}
          <Button onClick={() => setColorTarget(null)}>{t("setNews.cancel")}</Button>
          <Button variant="contained" onClick={() => applyColor(pickerColor)}>
            {t("setNews.select")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
}
