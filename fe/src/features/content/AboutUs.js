"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, Box, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { lighten } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import { useTranslation } from "@/i18n/useTranslation";
import { getSettings } from "@/features/auth/settingsApi";
import { DEFAULT_TEAM, displayName, initials } from "@/features/content/teamData";

function PersonCard({ name, accent, role, roleIcon }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1.5,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
        borderColor: `${accent}.main`,
        borderWidth: 2,
        bgcolor: (theme) => lighten(theme.palette[accent].main, 0.92),
      }}
    >
      <Avatar sx={{ width: 72, height: 72, bgcolor: `${accent}.main`, fontSize: "1.5rem", fontWeight: 600 }}>
        {initials(name)}
      </Avatar>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
        {name}
      </Typography>
      <Chip icon={roleIcon} label={role} color={accent} size="small" sx={{ fontWeight: 600 }} />
    </Paper>
  );
}

function SectionHeading({ icon, children }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
      {icon}
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function AboutUs() {
  const { t, locale } = useTranslation();
  // Team and services fall back to the built-in values while the setting is loading or unavailable.
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const storedServices = settings?.services?.[locale];
  const services = storedServices?.length ? storedServices : t("about.services");
  const team = (settings?.team ?? DEFAULT_TEAM).map((member) => ({ ...member, name: displayName(member) }));

  return (
    <Box sx={{ mx: { md: "-4%" } }}>
      <Box component="section">
        <SectionHeading icon={<LocalHospitalRoundedIcon sx={{ color: "red" }} />}>
          {t("about.team")}
        </SectionHeading>
        <Grid container spacing={2}>
          {team.map(({ role, name }, index) => (
            <Grid key={`${role}-${name}-${index}`} size={{ xs: 12, sm: 6, md: 2 }}>
              <PersonCard
                name={name}
                accent={role === "doctor" ? "primary" : "secondary"}
                role={t(role === "doctor" ? "about.doctor" : "about.nurse")}
                roleIcon={role === "doctor" ? <MedicalServicesRoundedIcon /> : <ChildCareRoundedIcon />}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Paper
        component="section"
        variant="outlined"
        sx={{ mt: 4, p: { xs: 2.5, md: 3.5 }, borderRadius: 3, bgcolor: "grey.50" }}
      >
        <SectionHeading>
          {t("about.servicesTitle")}
        </SectionHeading>
        {/* Each column is its own stack, so row heights in one column do not affect the other. */}
        <Grid container spacing={{ xs: 1.5, md: 3 }}>
          {Array.isArray(services) &&
            [services.slice(0, Math.ceil(services.length / 2)), services.slice(Math.ceil(services.length / 2))].map(
              (column, i) => (
                <Grid key={i} size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1.5}>
                    {column.map((service) => (
                      <Stack key={service} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                        <CheckCircleRoundedIcon color="success" fontSize="small" sx={{ mt: "3px" }} />
                        <Typography variant="body1">{service}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              )
            )}
        </Grid>
      </Paper>
    </Box>
  );
}
