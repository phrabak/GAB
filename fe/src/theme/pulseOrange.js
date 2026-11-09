import { keyframes } from "@emotion/react";

const pulseFrame = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(255, 152, 0, 0); }
`;

// Marks an empty text field of a newly added item; apply it to a TextField's sx.
export const pulseOrangeFieldSx = {
  "& .MuiOutlinedInput-root": { animation: `${pulseFrame} 1.2s ease-in-out infinite` },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ff9800", borderWidth: 2 },
};