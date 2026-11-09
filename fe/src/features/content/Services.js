"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  CircularProgress,
  Fade,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import { useTranslation } from "@/i18n/useTranslation";
import { getPreventiveCheckups } from "./preventiveCheckupsApi";
import { resolvePreventiveCheckups } from "./preventiveCheckupsData";
import earringImage from "@/images/earring.jpg";

const INFOGRAM_LOADER_ID = "infogram-async";
const INFOGRAM_LOADER_SRC = "https://e.infogram.com/js/dist/embed-loader-min.js";
const NZIP_VACCINATION_URL = "https://www.nzip.cz/clanek/215-ockovaci-kalendar-pro-deti";

function VaccinationScheduleTable() {
  useEffect(() => {
    const embeds = window.InfogramEmbeds;
    if (embeds && embeds.initialized) {
      if (embeds.process) embeds.process();
    } else if (!document.getElementById(INFOGRAM_LOADER_ID)) {
      const script = document.createElement("script");
      script.async = true;
      script.id = INFOGRAM_LOADER_ID;
      script.src = INFOGRAM_LOADER_SRC;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <Box sx={{ bgcolor: "rgba(255, 255, 255, 0.65)", borderRadius: 2, p: 1 }}>
      <div
        className="infogram-embed"
        data-id="755dc6b9-e275-40bc-a3ce-feba6eba3274"
        data-type="interactive"
        data-title="PUB očkovací kalendář děti (NZIP 215)"
      />
    </Box>
  );
}

function PreventiveCheckupsTable({ checkups }) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderColor: "divider", borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "text.secondary", fontWeight: 400 }}>{checkups.columnLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {checkups.rows.map((row, index) => (
            <TableRow key={index} sx={{ "&:last-child td": { borderBottom: 0 } }}>
              <TableCell sx={{ color: "text.secondary" }}>{row.text}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// `initialTab` lets the editor's preview open straight on a tab.
export default function Services({ initialTab = "vaccination" }) {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isPending, startTransition] = useTransition();
  const [minSpinnerActive, setMinSpinnerActive] = useState(false);
  const minSpinnerTimeoutRef = useRef(null);
  const [contentReady, setContentReady] = useState(true);

  const handleTabChange = (_, value) => {
    if (minSpinnerTimeoutRef.current) {
      clearTimeout(minSpinnerTimeoutRef.current);
    }
    setContentReady(false);
    setMinSpinnerActive(true);
    minSpinnerTimeoutRef.current = setTimeout(() => {
      setMinSpinnerActive(false);
      minSpinnerTimeoutRef.current = null;
    }, 300);
    startTransition(() => setActiveTab(value));
  };

  const showSpinner = isPending || minSpinnerActive;

  const { data: storedCheckups } = useQuery({ queryKey: ["preventiveCheckups"], queryFn: getPreventiveCheckups });
  // Falls back to the built-in texts while loading or when the API is unavailable.
  const checkups = resolvePreventiveCheckups(storedCheckups, locale);
  const titleText =
    activeTab === "preventiveCheckups"
      ? checkups.title
      : t(`services.${activeTab === "vaccination" ? "vaccinationSchedule" : activeTab}.title`);

  return (
    <Box>
      <Box sx={{ width: "fit-content", maxWidth: "100%", mx: "auto", p: 2, mb: 1.5, bgcolor: "rgba(255, 255, 255, 0.65)", borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          centered
        >
          <Tab label={t("services.tabs.vaccination")} value="vaccination" />
          <Tab label={t("services.tabs.earPiercing")} value="earPiercing" />
          <Tab label={t("services.tabs.preventiveCheckups")} value="preventiveCheckups" />
        </Tabs>
      </Box>
      {!showSpinner && contentReady && titleText && (
        <Typography
          variant="h6"
          component="h2"
          sx={{
            p: 2,
            mb: 1.5,
            bgcolor: "rgba(255, 255, 255, 0.65)",
            borderRadius: 2,
            ...(["vaccination", "preventiveCheckups"].includes(activeTab) && { fontSize: "0.875rem", fontWeight: 400 }),
          }}
        >
          {titleText}
          {activeTab === "vaccination" && (
            <>
              {" "}
              <Link href={NZIP_VACCINATION_URL} target="_blank" rel="noopener noreferrer">
                {t("services.vaccinationSchedule.titleLinkText")}
              </Link>
            </>
          )}
        </Typography>
      )}

      {/* always shown for at least 1s on tab switch, and longer if the render is actually deferred */}
      <Fade in={showSpinner} unmountOnExit onExited={() => setContentReady(true)}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={72}
              thickness={3.5}
              sx={{ color: (theme) => theme.palette.grey[200] }}
            />
            <CircularProgress
              variant="indeterminate"
              disableShrink
              size={72}
              thickness={3.5}
              sx={{ position: "absolute", left: 0, color: "primary.main" }}
            />
          </Box>
        </Box>
      </Fade>

      {!showSpinner && contentReady && activeTab === "vaccination" && (
        <Box>
          <VaccinationScheduleTable />
        </Box>
      )}

      {!showSpinner && contentReady && activeTab === "earPiercing" && (
        <Box>
          <Grid container spacing={3} rowSpacing={1.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ p: 2, bgcolor: "rgba(255, 255, 255, 0.65)", borderRadius: 2 }}
              >
                {t("services.earPiercing.text")}
              </Typography>

              <Box sx={{ mt: 1.5, maxWidth: 560 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    pt: "56.25%",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    component="iframe"
                    src="https://www.youtube.com/embed/f6sF0VVEEEA"
                    title={t("services.earPiercing.title")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                  />
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                component="img"
                src={earringImage.src}
                alt={t("services.earPiercing.title")}
                sx={{ width: "100%", height: "auto", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {!showSpinner && contentReady && activeTab === "preventiveCheckups" && (
        <Box>
          <PreventiveCheckupsTable checkups={checkups} />
        </Box>
      )}
    </Box>
  );
}

