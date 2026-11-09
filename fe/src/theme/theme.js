import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const baseTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0B3D91",
    },
    secondary: {
      main: "#00897B",
    },
    background: {
      default: "#f4f6f8",
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: [
      "Roboto",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

const theme = responsiveFontSizes(baseTheme);

export default theme;
