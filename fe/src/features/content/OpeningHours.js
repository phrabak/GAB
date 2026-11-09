"use client";

import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/useTranslation";
import { getOpeningHours } from "./openingHoursApi";
import { resolveBloodDraw, resolveOffices } from "./openingHoursData";

function OfficeTable({ label, phone, schedule, t }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Table size="small" sx={{ "& .MuiTableCell-root": { px: { xs: 1, sm: 2 } } }}>
        <TableHead>
          <TableRow>
            <TableCell
              colSpan={3}
              sx={{
                bgcolor: "grey.500",
                color: "common.white",
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontSize: "0.875rem",
                py: 1.25,
              }}
            >
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", columnGap: 2 }}>
                <span>{label}</span>
                <span style={{ whiteSpace: "nowrap" }}>{phone}</span>
              </Box>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 500 }}>{t("openingHours.day")}</TableCell>
            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 500 }}>{t("openingHours.time")}</TableCell>
            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 500 }}>{t("openingHours.service")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedule.map((group, groupIndex) => {
            const isLastGroup = groupIndex === schedule.length - 1;
            return group.rows.map((row, index) => {
              const isGroupEnd = index === group.rows.length - 1 && !isLastGroup;
              return (
                <TableRow
                  key={`${group.day}-${index}`}
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                    "&:hover .hoverable-cell": { bgcolor: "#e3f2fd" },
                  }}
                >
                  {index === 0 && (
                    <TableCell
                      rowSpan={group.rows.length}
                      sx={{
                        verticalAlign: "top",
                        bgcolor: "grey.50",
                        color: "text.secondary",
                        fontWeight: 500,
                        ...(isLastGroup
                          ? {}
                          : { borderBottom: "1px solid", borderBottomColor: "grey.400" }),
                      }}
                    >
                      {group.day}
                    </TableCell>
                  )}
                  <TableCell
                    className="hoverable-cell"
                    sx={{
                      color: "text.secondary",
                      whiteSpace: "nowrap",
                      ...(isGroupEnd && { borderBottom: "1px solid", borderBottomColor: "grey.400" }),
                    }}
                  >
                    {row.time}
                  </TableCell>
                  <TableCell
                    className="hoverable-cell"
                    sx={{
                      ...(isGroupEnd && { borderBottom: "1px solid", borderBottomColor: "grey.400" }),
                    }}
                  >
                    {row.service}
                  </TableCell>
                </TableRow>
              );
            });
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function LsppTable({ t, rows }) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Table size="small" sx={{ "& .MuiTableCell-root": { px: { xs: 1, sm: 2 } } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 500 }}>{t("openingHours.day")}</TableCell>
            <TableCell sx={{ bgcolor: "grey.50", fontWeight: 500 }}>{t("openingHours.lspp.title")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index} sx={{ "&:last-child td": { borderBottom: 0 } }}>
              <TableCell sx={{ bgcolor: "grey.50", color: "text.secondary", fontWeight: 500 }}>
                {row.day}
              </TableCell>
              <TableCell>{row.time}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function OpeningHours() {
  const { t, locale } = useTranslation();

  const { data: stored } = useQuery({ queryKey: ["openingHours"], queryFn: getOpeningHours });
  // Falls back to the built-in schedule while loading or when the API is unavailable.
  const [office1, office2] = resolveOffices(stored, locale, t).map((office) =>
    office.days.map((day) => ({ day: day.label, rows: day.rows }))
  );
  const bloodDraw = resolveBloodDraw(stored, locale);

  return (
    <Box>
      <Box sx={{ p: 2, mb: 1, bgcolor: "rgba(255, 255, 255, 0.65)", borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t("openingHours.title")}
        </Typography>
        <Typography variant="body1" align="center" sx={{ fontWeight: 500 }}>
          {t("openingHours.appointmentNotice")}
        </Typography>
      </Box>
      <Grid container columnSpacing={1.5} rowSpacing={0.75} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <OfficeTable label={t("openingHours.office1")} phone={t("contact.phone")} schedule={office1} t={t} />
          <Box sx={{ height: (theme) => theme.spacing(0.75) }} />
          {bloodDraw.notice && (
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.25, mb: 0.25 }}>
              {bloodDraw.notice}
            </Typography>
          )}
          {bloodDraw.rows.length > 0 && <LsppTable t={t} rows={bloodDraw.rows} />}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <OfficeTable label={t("openingHours.office2")} phone={t("contact.phone2")} schedule={office2} t={t} />
        </Grid>
      </Grid>
    </Box>
  );
}
