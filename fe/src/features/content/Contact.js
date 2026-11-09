"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Box, Card, CardContent, Link, Stack, Tooltip, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import FacebookIcon from "@mui/icons-material/Facebook";
import { useTranslation } from "@/i18n/useTranslation";
import { getContacts } from "@/features/content/contactsApi";
import { resolveContacts } from "@/features/content/contactsData";
import vzpLogo from "@/images/VZP_logo.png";
import vozpLogo from "@/images/vozp_logo_201.png";
import cpzpLogo from "@/images/cpzp_logo.png";
import ozpLogo from "@/images/ozp_logo.png";
import zpmvcrLogo from "@/images/zpmvcr_logo.png";

const cardSx = { borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.08)" };

function ContactRow({ icon, children }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      {icon}
      <Typography variant="body1" color="text.secondary">
        {children}
      </Typography>
    </Stack>
  );
}

function DoctorInfo({ accent, title, doctors, phone, email, databox, facebookUrl, facebookLabel }) {
  return (
    <Card elevation={0} sx={{ ...cardSx, flex: 1, borderTop: "4px solid", borderColor: `${accent}.main` }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
          {doctors.map((doctor, index) => (
            <Typography key={index} variant="body1" color="text.secondary">
              {doctor}
            </Typography>
          ))}

          <ContactRow icon={<PhoneIcon color={accent} />}>
            {phone && (
              <Link href={`tel:${phone.replace(/\s+/g, "")}`} color="inherit" underline="hover">
                {phone}
              </Link>
            )}
          </ContactRow>

          <ContactRow icon={<EmailIcon color={accent} />}>
            {email && (
              <Link href={`mailto:${email}`} color="inherit" underline="hover">
                {email}
              </Link>
            )}
          </ContactRow>

          <ContactRow icon={<MarkEmailReadIcon color={accent} />}>{databox}</ContactRow>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {facebookUrl ? (
              <Link
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="hover"
                sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
              >
                <FacebookIcon sx={{ color: "#1877F2" }} />
                {facebookLabel}
              </Link>
            ) : (
              <>
              </>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const { data: stored } = useQuery({ queryKey: ["contacts"], queryFn: getContacts });
  const [practice1, practice2] = resolveContacts(stored, t);
  const address = `${t("contact.addressLine1")} ${t("contact.addressLine2")}`;
  const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  const mapOpenUrl = `https://maps.google.com/maps?ll=50.667669,14.075895&z=16&t=m&hl=cs&gl=CZ&mapclient=embed&cid=4164312775930533254`;

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <Stack spacing={2} sx={{ width: { xs: "100%", md: "60%" } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <DoctorInfo
            accent="primary"
            title={t("contact.ordination1")}
            doctors={practice1.doctors}
            phone={practice1.phone}
            email={practice1.email}
            databox={practice1.dataBox}
            facebookUrl={practice1.facebook}
            facebookLabel={t("contact.facebook")}
          />
          <DoctorInfo
            accent="secondary"
            title={t("contact.ordination2")}
            doctors={practice2.doctors}
            phone={practice2.phone}
            email={practice2.email}
            databox={practice2.dataBox}
            facebookUrl={practice2.facebook}
            facebookLabel={t("contact.facebook")}
          />
        </Stack>

        <Card elevation={0} sx={{ ...cardSx, flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Stack spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "center", alignItems: "center" }}>
                <LocationOnIcon color="primary" />
                <Typography variant="body1" color="text.secondary">
                  {address}
                </Typography>
              </Stack>

              <Tooltip title={t("contact.mapHint")}>
                <Box
                  sx={{
                    position: "relative",
                    flexGrow: 1,
                    minHeight: { xs: 280, md: 200 },
                    width: "100%",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    component="iframe"
                    src={mapEmbedSrc}
                    title={t("contact.mapTitle")}
                    loading="lazy"
                    sx={{ width: "100%", height: "100%", border: 0, pointerEvents: "none" }}
                  />
                  <Link
                    href={mapOpenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("contact.mapHint")}
                    sx={{ position: "absolute", inset: 0, cursor: "pointer" }}
                  />
                </Box>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card elevation={0} sx={{ ...cardSx, width: { xs: "100%", md: "40%" } }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" component="p">
              {t("contact.insuranceTitle")}
            </Typography>

            {[
              { href: "https://www.vzp.cz/", logo: vzpLogo, labelKey: "contact.insuranceVzpAlt" },
              { href: "https://www.vozp.cz/", logo: vozpLogo, labelKey: "contact.insuranceVozpAlt" },
              { href: "https://www.cpzp.cz/", logo: cpzpLogo, labelKey: "contact.insuranceCpzpAlt" },
              { href: "https://www.ozp.cz/", logo: ozpLogo, labelKey: "contact.insuranceOzpAlt" },
              { href: "https://www.zpmvcr.cz/", logo: zpmvcrLogo, labelKey: "contact.insuranceZpmvcrAlt" },
            ].map(({ href, logo, labelKey }) => (
              <Tooltip key={href}>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="inherit"
                  underline="none"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    borderRadius: 2,
                    p: 1,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <Typography variant="body1">{t(labelKey)}</Typography>
                  <Box sx={{ position: "relative", height: 64, width: "100%" }}>
                    <Image src={logo} alt="" fill sizes="160px" style={{ objectFit: "contain" }} />
                  </Box>
                </Link>
              </Tooltip>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
