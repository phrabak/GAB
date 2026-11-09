"use client";

import { keyframes } from "@emotion/react";
import { Box } from "@mui/material";
import background from "@/images/backgroound.png";

const RATIO = background.width / background.height;

const sweep = keyframes`
  from { transform: translateX(-100%) skewX(-20deg); }
  to { transform: translateX(250%) skewX(-20deg); }
`;

/**
 * Shared decorative background covering the viewport on every page.
 */
export default function SideDecorBand() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "#c7d4d0",
      }}
    >
      {/* Replicates background-size: cover. */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `max(100vw, ${RATIO} * 100dvh)`,
          height: `max(100dvh, 100vw / ${RATIO})`,
          transform: "translate(-50%, -50%)",
          backgroundImage: `url("${background.src}")`,
          backgroundSize: "100% 100%",
        }}
      />
      {/* Mounted once in the root layout, so this sweep runs only on the first page load. */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "40%",
          background:
            "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0) 100%)",
          animation: `${sweep} 1.8s ease-in-out 0.3s both`,
        }}
      />
    </Box>
  );
}

