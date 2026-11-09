"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { keyframes } from "@emotion/react";
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
  Button,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import PersonIcon from "@mui/icons-material/Person";
import LockResetIcon from "@mui/icons-material/LockReset";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SettingsIcon from "@mui/icons-material/Settings";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import { authAtom, selectedMenuAtom } from "@/store/atoms";
import { useTranslation } from "@/i18n/useTranslation";
import LoginForm from "@/features/auth/LoginForm";
import SetPassword from "@/features/auth/SetPassword";
import SetNews from "@/features/auth/SetNews";
import SetAboutUs from "@/features/auth/SetAboutUs";
import SetOpeningHours from "@/features/auth/SetOpeningHours";
import SetPreventiveCheckups from "@/features/auth/SetPreventiveCheckups";
import SetContact from "@/features/auth/SetContact";
import AboutUs from "@/features/content/AboutUs";
import Contact from "@/features/content/Contact";
import News from "@/features/content/News";
import OpeningHours from "@/features/content/OpeningHours";
import PriceList from "@/features/content/PriceList";
import Services from "@/features/content/Services";
import WalkingPediatrician from "@/components/WalkingPediatrician";

const tabValues = ["news", "about", "contact", "openingHours", "priceList", "services"];

const reveal = keyframes`
  from { opacity: 0; top: 12px; }
  to { opacity: 1; top: 0; }
`;

// Icon-only on phones so the app bar fits narrow screens.
const authButtonSx = {
  minWidth: { xs: 40, sm: 64 },
  px: { xs: 1, sm: 2 },
  "& .MuiButton-startIcon": { mx: { xs: 0, sm: 0 }, mr: { sm: 1 }, ml: { sm: -0.5 } },
  "& .auth-label": { display: { xs: "none", sm: "inline" } },
};

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); box-shadow: 0 0 0 12px rgba(255, 255, 255, 0); }
`;

export default function AppShell() {
  const { t, locale } = useTranslation();
  const [selectedMenu, setSelectedMenu] = useAtom(selectedMenuAtom);
  const setAuth = useSetAtom(authAtom);
  const [auth] = useAtom(authAtom);
  const [loginOpen, setLoginOpen] = useState(false);
  const [justSignedIn, setJustSignedIn] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  // Distance from the viewport top to the app bar's bottom edge, where the pediatrician peeks out.
  const [barBottom, setBarBottom] = useState(64);
  const appBarRef = useRef(null);
  // Set once the user leaves News, so the pediatrician appears only on the first page load.
  const [walkerDone, setWalkerDone] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // The animation is laid out for a large viewport (also in landscape phones).
  const smallViewport = useMediaQuery("(max-width:599.95px), (max-height:599.95px)");

  useEffect(() => {
    if (selectedMenu !== "news") setWalkerDone(true);
  }, [selectedMenu]);

  useEffect(() => {
    if (selectedMenu === "news") setBarBottom(appBarRef.current?.getBoundingClientRect().bottom ?? 64);
  }, [selectedMenu]);

  // Declares the page language so the browser does not auto-translate Czech content.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const closeUserMenu = () => setUserMenuAnchor(null);

  const handleMenuChange = (_, value) => {
    setSelectedMenu(value);
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("auth_token");
    }
    setAuth({ isAuthenticated: false, token: null, user: null });
  };

  return (
    <Box sx={{ minHeight: "100vh", position: "relative" }}>
      <Box sx={{ position: "relative", zIndex: 1 }}>
      <AppBar ref={appBarRef} position="static" color="primary" elevation={1}>
        <Toolbar sx={{ gap: { xs: 1, md: 2 }, px: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            edge="start"
            aria-label={t("menu.open")}
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, minWidth: 0, fontWeight: 700, fontSize: { xs: "1rem", md: "1.25rem" } }}
          >
            {t("appTitle")}
            <Typography
              component="div"
              variant="h6"
              sx={{ fontWeight: 700, opacity: 0.9, lineHeight: 1.2, fontSize: { xs: "0.8rem", md: "1.25rem" } }}
            >
              {t("appSubtitle")}
            </Typography>
          </Typography>

          <Tabs
            value={tabValues.includes(selectedMenu) ? selectedMenu : false}
            onChange={handleMenuChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            <Tab label={t("menu.news")} value="news" />
            <Tab label={t("menu.about")} value="about" />
            <Tab label={t("menu.contact")} value="contact" />
            <Tab label={t("menu.openingHours")} value="openingHours" />
            <Tab label={t("menu.priceList")} value="priceList" />
            <Tab label={t("menu.services")} value="services" />
          </Tabs>

          {auth.isAuthenticated ? (
            <>
              {auth.user && (
                <>
                  <Tooltip title={auth.user.displayName}>
                    <IconButton
                      onClick={(event) => setUserMenuAnchor(event.currentTarget)}
                      aria-label={auth.user.displayName}
                      aria-haspopup="menu"
                      size="small"
                    >
                      <Avatar
                        alt={auth.user.displayName}
                        onAnimationEnd={() => setJustSignedIn(false)}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: "secondary.main",
                          animation: justSignedIn ? `${pulse} 0.7s ease-out 3` : "none",
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={closeUserMenu}
                  >
                    <MenuItem
                      onClick={() => {
                        closeUserMenu();
                        setSelectedMenu("setPassword");
                      }}
                    >
                      <ListItemIcon>
                        <LockResetIcon fontSize="small" />
                      </ListItemIcon>
                      {t("auth.setPassword")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        closeUserMenu();
                        setSelectedMenu("setNews");
                      }}
                    >
                      <ListItemIcon>
                        <EditNoteIcon fontSize="small" />
                      </ListItemIcon>
                      {t("auth.manageNews")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        closeUserMenu();
                        setSelectedMenu("setAboutUs");
                      }}
                    >
                      <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      {t("auth.setAboutUs")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        closeUserMenu();
                        setSelectedMenu("setOpeningHours");
                      }}
                    >
                      <ListItemIcon>
                        <ScheduleIcon fontSize="small" />
                      </ListItemIcon>
                      {t("auth.setOpeningHours")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        closeUserMenu();
                        setSelectedMenu("setPreventiveCheckups");
                      }}
                    >
                      <ListItemIcon>
                        <HealthAndSafetyIcon fontSize="small" />
                      </ListItemIcon>
                      {t("auth.setPreventiveCheckups")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        closeUserMenu();
                        setSelectedMenu("setContact");
                      }}
                    >
                      <ListItemIcon>
                        <ContactPhoneIcon fontSize="small" />
                      </ListItemIcon>
                      {t("auth.setContact")}
                    </MenuItem>
                  </Menu>
                </>
              )}
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleSignOut}
                aria-label={t("auth.signOutButton")}
                sx={authButtonSx}
              >
                <span className="auth-label">{t("auth.signOutButton")}</span>
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<LoginIcon />}
              onClick={() => setLoginOpen(true)}
              aria-label={t("auth.signInButton")}
              sx={authButtonSx}
            >
              <span className="auth-label">{t("auth.signInButton")}</span>
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 260 }}>
          {tabValues.map((value) => (
            <ListItemButton
              key={value}
              selected={selectedMenu === value}
              onClick={() => {
                setSelectedMenu(value);
                setDrawerOpen(false);
              }}
            >
              <ListItemText primary={t(`menu.${value}`)} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Animates `top` instead of `transform` so fixed-position children stay viewport-anchored. */}
        <Box key={selectedMenu} sx={{ position: "relative", animation: `${reveal} 0.6s ease-out` }}>
        {/* The Zajíc section intentionally has no content. */}
        {selectedMenu === "news" && <News />}
        {selectedMenu === "about" && <AboutUs />}
        {selectedMenu === "contact" && <Contact />}
        {selectedMenu === "openingHours" && <OpeningHours />}
        {selectedMenu === "priceList" && <PriceList />}
        {selectedMenu === "services" && <Services />}
        {selectedMenu === "setPassword" && auth.isAuthenticated && <SetPassword />}
        {selectedMenu === "setNews" && auth.isAuthenticated && <SetNews />}
        {selectedMenu === "setAboutUs" && auth.isAuthenticated && <SetAboutUs />}
        {selectedMenu === "setOpeningHours" && auth.isAuthenticated && <SetOpeningHours />}
        {selectedMenu === "setPreventiveCheckups" && auth.isAuthenticated && <SetPreventiveCheckups />}
        {selectedMenu === "setContact" && auth.isAuthenticated && <SetContact />}
        </Box>
      </Container>
      </Box>
      <LoginForm open={loginOpen} onClose={() => setLoginOpen(false)} onSignedIn={() => setJustSignedIn(true)} />
      {selectedMenu === "news" && !walkerDone && !smallViewport && <WalkingPediatrician top={barBottom} />}
    </Box>
  );
}
