"use client";

import { Box, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/useTranslation";
import { getNews } from "./newsApi";

// Perceived brightness (0-1) below which a color counts as dark.
const DARK_THRESHOLD = 0.45;

function isDark(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? "");
  if (!match) return true;
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < DARK_THRESHOLD;
}

export default function News() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuery({ queryKey: ["news"], queryFn: getNews });

  const items = (data ?? []).filter((item) => item.active);

  return (
    <Box
      sx={{
        width: { xs: "100%", md: "90vw" },
        // Centers the 90vw box even though its parent Container is narrower.
        ml: { xs: 0, md: "calc(50% - 45vw)" },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1,
            bgcolor: "#1e88e5",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* An upside-down exclamation mark reads as the "i" of an info sign. */}
          <PriorityHighRoundedIcon sx={{ fontSize: 18, transform: "rotate(180deg)" }} />
        </Box>
        <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
          {t("news.title")}
        </Typography>
      </Stack>

      {(isPending || isError || items.length > 0) && (
      <Box sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.8)", borderRadius: 2 }}>
      {isPending && <CircularProgress size={32} />}
      {isError && <Typography color="error">{t("news.loadFailed")}</Typography>}

      {items.map((item, index) => (
        <Box
          key={index}
          sx={{
            ...(index > 0 && { mt: "1.125em" }),
            ...(item.panelColor && { bgcolor: item.panelColor, p: 1.5, borderRadius: 2 }),
            ...(item.panelColor && !isDark(item.panelColor) && !item.showLine && { border: "1px solid #8a8a8a" }),
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              color: item.color || "inherit",
              fontWeight: item.fontBold ? 700 : 400,
              ...(!isDark(item.color) && {
                WebkitTextStroke: "1px #000",
                // Draws the stroke behind the fill so the outline doesn't thin the letters.
                paintOrder: "stroke fill",
              }),
              ...(item.backgroundColor && { bgcolor: item.backgroundColor, px: 1, borderRadius: 1 }),
            }}
          >
            {item.title}
          </Typography>
          <Typography variant="body1" sx={{ mt: item.text?.trim() ? 1.5 : 0, whiteSpace: "pre-line" }}>
            {item.text}
          </Typography>
          {item.showLine && <Divider sx={{ mt: 1, borderColor: "silver" }} />}
        </Box>
      ))}
      </Box>
      )}
    </Box>
  );
}
