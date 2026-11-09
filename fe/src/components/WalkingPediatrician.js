"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import { keyframes } from "@emotion/react";
import { useTranslation } from "@/i18n/useTranslation";

const WIDTH = 180;
const HEIGHT = 300;

const SKIN = "#f5c6a0";
const SKIN_LINE = "#e0a982";
const SKIN_SHINE = "#fbdcc6";
const HAIR = "#8a7766";
const BROW = "#a08670";
const BEARD = "#5e3f2c";
const IRIS = "#4b5a63";
const GLASSES = "#4f4a47";
const COAT = "#ffffff";
const COAT_LINE = "#90a4ae";
const SCRUBS = "#26a69a";
const SCRUBS_DARK = "#00796b";
const SHOE = "#37474f";
const STETH = "#455a64";
const METAL = "#cfd8dc";
const CHEEK = "#f48fb1";
const BLONDE = "#e8c77e";
const BLONDE_DARK = "#a8823f";
const FRECKLE = "#c98a5e";
const SHADES = "#2c3a55";

// Timeline in seconds.
const PEEK = 3;
const DROP = 1;
const APPROACH = 2.3;
const LOOK = 2.2;
const EXIT = 2;
const ENTER = 0.7;
const CLOSE = 0.6;
const FADE = 0.25;
const TURN = 0.4;
const STEP = 0.26;

const T_DROP = PEEK;
const T_APPROACH = T_DROP + DROP;
const T_LOOK = T_APPROACH + APPROACH;
const T_EXIT = T_LOOK + LOOK;
const T_DOOR = T_EXIT + EXIT;
const T_INSIDE = T_DOOR + ENTER;
const T_CLOSED = T_INSIDE + CLOSE;
const DURATION = T_CLOSED;

const pct = (seconds) => `${Math.min(100, Math.max(0, (seconds / DURATION) * 100)).toFixed(3)}%`;

const SMALL = 0.6;
const START_X = "calc(-50% - 25vw)";
// --bar is the app bar height; this puts his feet 48px above the bottom of the screen.
const GROUND_Y = `calc(100vh - var(--bar) - ${HEIGHT + 48}px)`;

const HIDDEN_UP = `translateX(${START_X}) translateY(-${HEIGHT}px) scale(${SMALL})`;
const LEDGE = `translateX(${START_X}) translateY(-100px) scale(${SMALL})`;
const CENTER = `translateX(-50%) translateY(${GROUND_Y}) scale(1)`;
const DOOR_W = 130;
const DOOR_H = 290;
const DOOR_FRAME = 10;
const DOOR_MARGIN = 40;
// Sits just below his feet so he stands on the door's threshold.
const DOOR_BOTTOM = 64;
const DOOR_X = `calc(50vw - ${DOOR_MARGIN + DOOR_W / 2}px)`;

const AT_DOOR = `translateX(calc(-50% + ${DOOR_X})) translateY(${GROUND_Y}) scale(1)`;
const INSIDE = `translateX(calc(-50% + ${DOOR_X})) translateY(calc(${GROUND_Y} - 6px)) scale(0.9)`;

const path = keyframes`
  0%, ${pct(T_DROP)} { transform: ${HIDDEN_UP}; animation-timing-function: cubic-bezier(0.3, 0, 0.4, 1); }
  ${pct(T_APPROACH)} { transform: ${LEDGE}; animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); }
  ${pct(T_LOOK)}, ${pct(T_EXIT)} { transform: ${CENTER}; animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
  ${pct(T_DOOR)} { transform: ${AT_DOOR}; opacity: 1; filter: brightness(1); }
  ${pct(T_INSIDE)}, 100% { transform: ${INSIDE}; opacity: 0; filter: brightness(0.3); }
`;

// Hinged on the right, the leaf swings away from the viewer into the room as the doctor walks in.
const T_DOOR_OPEN = T_EXIT + 0.5;
const ENTRY = T_CLOSED - T_DOOR_OPEN;
const ep = (seconds) => `${(((seconds - T_DOOR_OPEN) / ENTRY) * 100).toFixed(3)}%`;
const doorSwing = keyframes`
  0% { transform: perspective(600px) rotateY(0deg); animation-timing-function: ease-out; }
  ${ep(T_EXIT + 1.2)}, ${ep(T_INSIDE)} { transform: perspective(600px) rotateY(-80deg); animation-timing-function: ease-in; }
  100% { transform: perspective(600px) rotateY(0deg); }
`;

// Clicking the closed door replays a short visit: open, peek out and wave, close.
// How long the visitor is visible in the doorway, from 0.5s until VISIT + 0.5s.
const VISIT = 2.72;
const KNOCK = VISIT + 1;
const kp = (seconds) => `${((seconds / KNOCK) * 100).toFixed(3)}%`;

const knockSwing = keyframes`
  0% { transform: perspective(600px) rotateY(0deg); animation-timing-function: ease-out; }
  ${kp(0.6)}, ${kp(VISIT + 0.4)} { transform: perspective(600px) rotateY(-80deg); animation-timing-function: ease-in; }
  100% { transform: perspective(600px) rotateY(0deg); }
`;

// The door pops up from its threshold just as the doctor starts climbing down.
const DOOR_APPEAR = 0.8;
const doorAppear = keyframes`
  0% { opacity: 0; transform: scale(0.4); animation-timing-function: ease-out; }
  70% { opacity: 1; transform: scale(1.06); animation-timing-function: ease-in-out; }
  100% { opacity: 1; transform: scale(1); }
`;

const tapHint = keyframes`
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
`;

const PEEK_AWAY = "translateX(calc(-50% + 110px)) rotate(0deg) scale(0.9)";
const knockPeek = keyframes`
  0%, ${kp(0.5)} { transform: ${PEEK_AWAY}; animation-timing-function: ease-out; }
  ${kp(1.1)}, ${kp(VISIT - 0.1)} { transform: translateX(calc(-50% + 15px)) rotate(-6deg) scale(0.9); animation-timing-function: ease-in; }
  ${kp(VISIT + 0.5)}, 100% { transform: ${PEEK_AWAY}; }
`;

// Upside-down head leaning out from under the app bar; the clip container hides everything above the bar edge.
const PEEK_HIDDEN = `translate(-50%, -235px) rotate(180deg) scale(${SMALL})`;
const peek = keyframes`
  0% { transform: ${PEEK_HIDDEN}; animation-timing-function: cubic-bezier(0.3, 0, 0.4, 1); }
  ${pct(0.8)} { transform: translate(-50%, -159px) rotate(180deg) scale(${SMALL}); }
  ${pct(1.4)} { transform: translate(-50%, -157px) rotate(172deg) scale(${SMALL}); }
  ${pct(2)} { transform: translate(-50%, -157px) rotate(188deg) scale(${SMALL}); }
  ${pct(2.4)} { transform: translate(-50%, -159px) rotate(180deg) scale(${SMALL}); animation-timing-function: cubic-bezier(0.6, 0, 0.7, 1); }
  ${pct(PEEK - 0.1)}, 100% { transform: ${PEEK_HIDDEN}; }
`;

const walkFrames = keyframes`
  0%, ${pct(T_LOOK - FADE / 2)} { opacity: 1; }
  ${pct(T_LOOK + FADE / 2)}, 100% { opacity: 0; }
`;

// The front view squeezes while the profile unfolds, which reads as turning sideways.
const lookFrames = keyframes`
  0%, ${pct(T_LOOK - FADE / 2)} { opacity: 0; transform: scaleX(1); }
  ${pct(T_LOOK + FADE / 2)}, ${pct(T_EXIT - TURN / 2)} { opacity: 1; transform: scaleX(1); }
  ${pct(T_EXIT + TURN / 2)}, 100% { opacity: 0; transform: scaleX(0.4); }
`;

const tilt = keyframes`
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
`;

const sideFrames = keyframes`
  0%, ${pct(T_EXIT - TURN / 2)} { opacity: 0; transform: scaleX(0.4); }
  ${pct(T_EXIT + TURN / 2)}, 100% { opacity: 1; transform: scaleX(1); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

// Seen from the front, a stepping leg mostly lifts and foreshortens.
const legLift = keyframes`
  from { transform: translateY(0) scaleY(1); }
  to { transform: translateY(-5px) scaleY(0.92); }
`;

const armSwing = keyframes`
  from { transform: rotate(7deg); }
  to { transform: rotate(-7deg); }
`;

const sideSwing = keyframes`
  from { transform: rotate(22deg); }
  to { transform: rotate(-22deg); }
`;

const wave = keyframes`
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(20deg); }
`;

const limb = (frames, direction) => ({
  transformBox: "fill-box",
  transformOrigin: "50% 0%",
  animation: `${frames} ${STEP}s ease-in-out infinite ${direction}`,
});

const layer = (frames) => ({
  position: "absolute",
  inset: 0,
  animation: `${frames} ${DURATION}s linear forwards`,
});

function Arm({ d, hand, className }) {
  return (
    <g className={className}>
      <path d={d} stroke={COAT_LINE} strokeWidth="12.5" fill="none" strokeLinecap="round" />
      <path d={d} stroke={COAT} strokeWidth="10" fill="none" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="6" fill={SKIN} />
    </g>
  );
}

const LEFT_ARM_DOWN = { d: "M37 77 Q29 98 32 117", hand: [32, 120] };
const RIGHT_ARM_DOWN = { d: "M83 77 Q91 98 88 117", hand: [88, 120] };

function SideLeg({ className, shade }) {
  return (
    <g className={className}>
      <rect x="54" y="124" width="13" height="54" rx="4" fill={shade} />
      <ellipse cx="64" cy="180" rx="10" ry="5" fill={SHOE} />
    </g>
  );
}

// Profile facing right, used while walking off to the right.
function SidePose() {
  return (
    <svg width={WIDTH} height={HEIGHT} viewBox="0 0 120 200">
      <SideLeg className="side-b" shade="#005f56" />
      <Arm d="M60 77 Q58 98 60 116" hand={[60, 119]} className="side-a" />
      <SideLeg className="side-a" shade={SCRUBS_DARK} />
      <path d="M45 72 Q60 65 73 72 Q84 104 80 140 Q60 145 41 140 Q37 105 45 72 Z" fill={COAT} stroke={COAT_LINE} strokeWidth="1.5" />
      <path d="M66 70 L73 82 L72 70 Z" fill={SCRUBS} />
      <rect x="54" y="58" width="12" height="10" fill={SKIN} />
      <circle cx="60" cy="42" r="18" fill={SKIN} />
      <path d="M42 44 Q42 58 56 60 Q57 50 53 40 Q49 32 52 27 Q44 30 42 44 Z" fill={HAIR} opacity="0.6" />
      <ellipse cx="64" cy="28" rx="7" ry="2.5" fill={SKIN_SHINE} />
      <circle cx="55" cy="44" r="4" fill={SKIN} stroke={SKIN_LINE} strokeWidth="0.8" />
      <path d="M77 37 L82 45.5 Q80 47.5 77 47" fill={SKIN} stroke={SKIN_LINE} strokeWidth="1" />
      <path d="M67 36.3 Q71 35.3 75 36.5" stroke={BROW} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="73" cy="41.8" rx="1.9" ry="1.3" fill="#fff" />
      <circle cx="73.8" cy="41.9" r="1.1" fill={IRIS} />
      <path d="M71 41.2 Q73 39.9 75 41.2" stroke={SKIN_LINE} strokeWidth="1" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="49" r="2.5" fill={CHEEK} opacity="0.2" />
      <path d="M72.5 55.2 Q75 55.9 77 55" stroke="#9c4a3a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M71 52.4 Q75 49.8 78.5 52 Q75 51.6 71 52.4 Z" fill={BEARD} />
      <path d="M71.3 52.4 Q70.5 56 71.5 58.5" stroke={BEARD} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M70 57.5 Q71 63.5 75 63 Q78 60.5 77.5 57.5 Q74 59 70 57.5 Z" fill={BEARD} />
      <g stroke={GLASSES} strokeWidth="0.75" fill="none" opacity="0.85">
        <rect x="68.5" y="37.5" width="8.5" height="7.5" rx="1.2" />
        <line x1="68.5" y1="39.5" x2="57" y2="42" />
      </g>
      <path d="M56 60 Q50 68 58 72 Q68 76 68 88" stroke={STETH} strokeWidth="2" fill="none" />
      <circle cx="68" cy="92" r="4" fill={METAL} stroke={STETH} strokeWidth="1.5" />
      <Arm d="M60 77 Q62 98 60 116" hand={[60, 119]} className="side-b" />
    </svg>
  );
}

function Legs({ walking }) {
  return (
    <>
      <g className={walking ? "leg-l" : undefined}>
        <rect x="45" y="126" width="13" height="52" rx="4" fill={SCRUBS_DARK} />
        <ellipse cx="51" cy="180" rx="9" ry="5" fill={SHOE} />
      </g>
      <g className={walking ? "leg-r" : undefined}>
        <rect x="62" y="126" width="13" height="52" rx="4" fill={SCRUBS_DARK} />
        <ellipse cx="69" cy="180" rx="9" ry="5" fill={SHOE} />
      </g>
    </>
  );
}

function Figure({ walking = false, stethToEye = false, children }) {
  return (
    <svg width={WIDTH} height={HEIGHT} viewBox="0 0 120 200">
      <Legs walking={walking} />
      <path d="M37 72 Q60 63 83 72 Q92 105 89 140 Q60 147 31 140 Q28 105 37 72 Z" fill={COAT} stroke={COAT_LINE} strokeWidth="1.5" />
      <path d="M52 70 L60 84 L68 70 Z" fill={SCRUBS} />
      <line x1="60" y1="84" x2="60" y2="144" stroke={COAT_LINE} />
      <rect x="68" y="100" width="12" height="10" fill="none" stroke={COAT_LINE} />
      <line x1="72" y1="96" x2="72" y2="103" stroke="#1e88e5" strokeWidth="1.5" />
      <rect x="54" y="58" width="12" height="10" fill={SKIN} />
      <circle cx="41.5" cy="44" r="4" fill={SKIN} />
      <circle cx="78.5" cy="44" r="4" fill={SKIN} />
      <ellipse cx="60" cy="42" rx="18.5" ry="20.5" fill={SKIN} />
      {/* Close-cropped hair that has receded from the forehead. */}
      <g stroke={HAIR} fill="none" strokeLinecap="round">
        <path d="M42.5 47 Q40.5 32 46.5 26" strokeWidth="2.5" opacity="0.65" />
        <path d="M77.5 47 Q79.5 32 73.5 26" strokeWidth="2.5" opacity="0.65" />
        <path d="M46.5 26 Q60 19.5 73.5 26" strokeWidth="1.4" opacity="0.3" />
      </g>
      <ellipse cx="60" cy="31" rx="7" ry="2.5" fill={SKIN_SHINE} />
      <g stroke={BROW} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M46.5 36.5 Q52 34.8 57 36.3" />
        <path d="M63 36.3 Q68 34.8 73.5 36.5" />
      </g>
      <ellipse cx="52" cy="41.8" rx="2.6" ry="1.4" fill="#fff" />
      <ellipse cx="68" cy="41.8" rx="2.6" ry="1.4" fill="#fff" />
      <circle cx="52" cy="41.9" r="1.2" fill={IRIS} />
      <circle cx="68" cy="41.9" r="1.2" fill={IRIS} />
      <g stroke={SKIN_LINE} fill="none" strokeLinecap="round">
        <path d="M49.3 41.2 Q52 39.8 54.7 41.2" strokeWidth="1" />
        <path d="M65.3 41.2 Q68 39.8 70.7 41.2" strokeWidth="1" />
        <path d="M49.6 43.3 Q52 44.3 54.4 43.3" strokeWidth="0.6" />
        <path d="M65.6 43.3 Q68 44.3 70.4 43.3" strokeWidth="0.6" />
        <path d="M59.2 38.5 L58.4 46.2 Q60 48 61.8 46.6" strokeWidth="1.1" />
      </g>
      <circle cx="50" cy="49" r="3" fill={CHEEK} opacity="0.2" />
      <circle cx="70" cy="49" r="3" fill={CHEEK} opacity="0.2" />
      <path d="M55.5 55.2 Q60 56.4 64.5 55.2" stroke="#9c4a3a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M57.5 57 Q60 57.8 62.5 57" stroke="#c98a78" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Thin mustache running down past the mouth into a narrow goatee. */}
      <path d="M53.5 52.6 Q60 49.6 66.5 52.6 Q60 51.6 53.5 52.6 Z" fill={BEARD} />
      <g stroke={BEARD} strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M53.8 52.6 Q53 56 55 59.5" />
        <path d="M66.2 52.6 Q67 56 65 59.5" />
      </g>
      <path d="M54.5 58.5 Q56 65 60 65.5 Q64 65 65.5 58.5 Q62.5 60.2 60 60.2 Q57.5 60.2 54.5 58.5 Z" fill={BEARD} />
      <path d="M59 58.3 L61 58.3 L60 60 Z" fill={BEARD} />
      <g stroke={GLASSES} strokeWidth="0.75" fill="none" opacity="0.85">
        <rect x="45" y="37.5" width="13.5" height="7.5" rx="1.2" />
        <rect x="61.5" y="37.5" width="13.5" height="7.5" rx="1.2" />
        <line x1="58.5" y1="39.5" x2="61.5" y2="39.5" />
      </g>
      <g stroke={STETH} strokeWidth="2" fill="none">
        <path d="M42 48 Q44 64 60 70" />
        <path d="M78 48 Q76 64 60 70" />
        <path d={stethToEye ? "M60 70 C50 92 22 84 44 49" : "M60 70 Q57 86 62 93"} />
      </g>
      {!stethToEye && <circle cx="62" cy="97" r="4" fill={METAL} stroke={STETH} strokeWidth="1.5" />}
      {children}
    </svg>
  );
}

// Holds the chestpiece up to one eye like a magnifying glass.
function LookPose() {
  return (
    <Figure stethToEye>
      <Arm {...RIGHT_ARM_DOWN} />
      <Arm d="M37 78 Q20 66 38 54" hand={[41, 50]} />
      <circle cx="52" cy="41.5" r="9" fill={METAL} stroke={STETH} strokeWidth="2" />
      <circle cx="52" cy="41.5" r="6.5" fill="#fff" />
      <circle cx="52.5" cy="42" r="3.3" fill={IRIS} />
      <circle cx="52.5" cy="42" r="1.6" fill="#1d2327" />
      <circle cx="54" cy="40.5" r="1" fill="#fff" />
      <circle cx="41" cy="50" r="6" fill={SKIN} />
    </Figure>
  );
}

// Modelled on the nurse's photo: high forehead, ash-blonde hair swept back with a clip, big aviators with sky
// reflections, prominent nose, wide toothy smile, freckles and a narrow chin.
function NursePose() {
  return (
    <svg width={WIDTH} height={HEIGHT} viewBox="0 0 120 200">
      <defs>
        <pattern id="nurse-toys" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.6" fill="#e53935" />
          <path d="M1.6 4 Q4 2.8 6.4 4" stroke="#fff" strokeWidth="0.6" fill="none" />
          <path d="M13 1 L13.7 2.6 L15.4 2.7 L14.1 3.8 L14.5 5.5 L13 4.6 L11.5 5.5 L11.9 3.8 L10.6 2.7 L12.3 2.6 Z" fill="#d81b60" />
          <rect x="2" y="11" width="4.5" height="4.5" rx="0.6" fill="#3949ab" />
          <ellipse cx="12.5" cy="14" rx="3" ry="1.8" fill="#ffd600" />
          <circle cx="14.2" cy="11.6" r="1.6" fill="#ffd600" />
          <path d="M15.6 11.5 L17 11.9 L15.6 12.3 Z" fill="#f57c00" />
          <circle cx="9" cy="8.5" r="1.1" fill="#43a047" />
        </pattern>
        <linearGradient id="nurse-shades" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SHADES} />
          <stop offset="1" stopColor="#4f5f78" />
        </linearGradient>
      </defs>
      {[
        [45, 51],
        [62, 69],
      ].map(([x, shoe]) => (
        <g key={x}>
          <rect x={x} y="126" width="13" height="52" rx="4" fill="#ff6d00" stroke="#d84315" strokeWidth="1" />
          <ellipse cx={shoe} cy="180" rx="9" ry="5" fill="#ec407a" stroke="#ad1457" strokeWidth="1" />
        </g>
      ))}
      <path d="M38 72 Q60 64 82 72 Q88 105 86 138 Q60 144 34 138 Q32 105 38 72 Z" fill="#4dd0e1" />
      <path d="M38 72 Q60 64 82 72 Q88 105 86 138 Q60 144 34 138 Q32 105 38 72 Z" fill="url(#nurse-toys)" stroke="#7b1fa2" strokeWidth="1.8" />
      {/* White shirt collar showing in the vest's V-neck. */}
      <path d="M51 70 L60 86 L69 70 Z" fill={COAT} stroke="#7b1fa2" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M53 70 L60 77 L67 70" fill={SKIN} />
      <rect x="54" y="58" width="12" height="12" fill={SKIN} />
      <circle cx="78.5" cy="46" r="4" fill={SKIN} />
      <path d="M42 40 Q42 21 60 20.5 Q78 21 78 40 Q78 53 70 60.5 Q65 65.5 60 65.5 Q55 65.5 50 60.5 Q42 53 42 40 Z" fill={SKIN} />
      {/* Hair swept back off a high forehead, covering one ear and tucked behind the other. */}
      <path d="M40.5 47 Q36 26 50 19 Q62 14.5 73 18.5 Q83 23.5 81 38 Q80.5 31 75 27.5 Q66 24 56 25.5 Q47 27.5 44.5 35 Q43.5 40 43.5 48 Z" fill={BLONDE} />
      <path d="M78 26 Q83 34 81 44 Q80.5 51 82 56 Q78.5 52 79 45 Q79.5 36 76.5 30 Z" fill={BLONDE} />
      <g stroke={BLONDE_DARK} strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.8">
        <path d="M46 30 Q55 21.5 71 23" />
        <path d="M49 27.5 Q60 20 75 24.5" />
        <path d="M42 43 Q39.5 32 45 25" />
        <path d="M80 37 Q81.5 45 80.5 52" />
      </g>
      <path d="M44 31 L48.5 28 L49.6 29.8 L45.2 32.8 Z" fill="#455a64" />
      <g fill={FRECKLE} opacity="0.5">
        <circle cx="55" cy="29" r="0.45" />
        <circle cx="63" cy="28.5" r="0.45" />
        <circle cx="58.5" cy="31.5" r="0.4" />
        <circle cx="47" cy="50" r="0.55" />
        <circle cx="49.5" cy="51.5" r="0.5" />
        <circle cx="52" cy="50" r="0.5" />
        <circle cx="57.5" cy="47.5" r="0.45" />
        <circle cx="62.5" cy="47.5" r="0.45" />
        <circle cx="68" cy="50" r="0.5" />
        <circle cx="70.5" cy="51.5" r="0.5" />
        <circle cx="73" cy="50" r="0.55" />
      </g>
      <circle cx="48" cy="53" r="3.2" fill={CHEEK} opacity="0.5" />
      <circle cx="72" cy="53" r="3.2" fill={CHEEK} opacity="0.5" />
      <path d="M59.2 44 Q57.4 50.5 59.4 51.8 Q61 52.6 62.8 51.4" stroke={SKIN_LINE} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <g stroke={SKIN_LINE} strokeWidth="0.7" fill="none" strokeLinecap="round">
        <path d="M51 50.5 Q48.6 54 50 57.5" />
        <path d="M69 50.5 Q71.4 54 70 57.5" />
      </g>
      <path d="M50 54 Q60 52.6 70 54 Q67 61.8 60 62.2 Q53 61.8 50 54 Z" fill="#c62f45" />
      <path d="M51.3 54.4 Q60 53.4 68.7 54.4 Q67.4 57.8 60 58.2 Q52.6 57.8 51.3 54.4 Z" fill="#fbf6e3" />
      <g stroke="#e3dcc4" strokeWidth="0.4">
        <line x1="56" y1="53.9" x2="56.2" y2="57.8" />
        <line x1="60" y1="53.7" x2="60" y2="58.2" />
        <line x1="64" y1="53.9" x2="63.8" y2="57.8" />
      </g>
      <path d="M53.5 61.4 Q60 63.6 66.5 61.4" stroke="#c98a78" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {/* Large aviator sunglasses. */}
      <g stroke="#78858f" strokeWidth="0.7">
        <path d="M42.5 37.5 Q43 35 51 35 Q58 35 58 38.5 Q57.5 47.5 51 48 Q44 47.5 42.5 37.5 Z" fill="url(#nurse-shades)" />
        <path d="M77.5 37.5 Q77 35 69 35 Q62 35 62 38.5 Q62.5 47.5 69 48 Q76 47.5 77.5 37.5 Z" fill="url(#nurse-shades)" />
        <path d="M50 35 Q60 33.6 70 35" fill="none" />
        <path d="M58 38.3 Q60 37.2 62 38.3" fill="none" />
        <line x1="42.5" y1="37" x2="40.5" y2="39" />
        <line x1="77.5" y1="37" x2="79.5" y2="39" />
      </g>
      <g opacity="0.45">
        <path d="M45.5 38.5 Q49 36.5 53 37" stroke="#fff" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M65 37 Q69 36.5 73 37.5" stroke="#fff" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <ellipse cx="52.5" cy="44.5" rx="2.2" ry="1.5" fill="#8bc34a" />
        <ellipse cx="67.5" cy="44.5" rx="2.2" ry="1.5" fill="#8bc34a" />
      </g>
      {/* Pediatric nurse cues: cap with a red cross, pink stethoscope with a heart chestpiece, teddy in the pocket. */}
      <path d="M46.5 21.5 Q47.5 12.5 60 11.5 Q72.5 12.5 73.5 21.5 Q60 18 46.5 21.5 Z" fill={COAT} stroke={COAT_LINE} strokeWidth="1" />
      <rect x="59" y="13.3" width="2" height="5.4" fill="#d50000" />
      <rect x="57.3" y="15" width="5.4" height="2" fill="#d50000" />
      <g stroke="#e91e63" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M46.5 62 Q47.5 72 58 75.5" />
        <path d="M73.5 62 Q72.5 72 62 75.5" />
        <path d="M60 75.5 Q55 88 62 95" />
      </g>
      <path d="M62 103 Q56 98.5 57.5 95.8 Q59.5 93.5 62 96 Q64.5 93.5 66.5 95.8 Q68 98.5 62 103 Z" fill="#f06292" stroke="#ad1457" strokeWidth="1" />
      <circle cx="70" cy="100" r="1.3" fill="#8d5a2b" />
      <circle cx="75" cy="100" r="1.3" fill="#8d5a2b" />
      <circle cx="72.5" cy="102.5" r="3.3" fill="#b9783f" />
      <circle cx="72.5" cy="103.6" r="1.3" fill="#f3d2a2" />
      <circle cx="71.3" cy="101.8" r="0.45" fill="#3e2723" />
      <circle cx="73.7" cy="101.8" r="0.45" fill="#3e2723" />
      <rect x="66" y="104" width="13" height="11" rx="1.5" fill="#ffeb3b" stroke="#7b1fa2" strokeWidth="1.2" />
      <Arm {...LEFT_ARM_DOWN} />
      <Arm d="M83 78 Q99 66 99 46" hand={[99, 40]} className="wave" />
    </svg>
  );
}

function Door({ knock, visitor, knocking, entering, clickable, onKnock, onKnockEnd }) {
  const { t } = useTranslation();
  const inner = DOOR_W - 2 * DOOR_FRAME;
  const leafH = DOOR_H - DOOR_FRAME;
  return (
    <Box
      sx={{
        position: "absolute",
        left: "50%",
        bottom: DOOR_BOTTOM,
        width: DOOR_W,
        height: DOOR_H,
        transform: `translateX(calc(-50% + ${DOOR_X}))`,
        pointerEvents: clickable ? "auto" : "none",
        cursor: "pointer",
      }}
      onClick={onKnock}
    >
      <svg width={DOOR_W} height={DOOR_H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="door-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#11181c" />
            <stop offset="1" stopColor="#37474f" />
          </linearGradient>
        </defs>
        <rect width={DOOR_W} height={DOOR_H} rx="3" fill="#81d4fa" />
        <rect x={DOOR_FRAME} y={DOOR_FRAME} width={inner} height={leafH} fill="url(#door-dark)" />
      </svg>
      {knock > 0 && (
        <Box
          sx={{ position: "absolute", left: DOOR_FRAME, top: DOOR_FRAME, width: inner, height: leafH, overflow: "hidden" }}
        >
          <Box
            key={knock}
            sx={{
              position: "absolute",
              left: "50%",
              // Puts his feet on the threshold.
              bottom: -20,
              width: WIDTH,
              height: HEIGHT,
              transformOrigin: "50% 100%",
              transform: PEEK_AWAY,
              filter: visitor === "nurse" ? "saturate(1.25)" : "brightness(0.9)",
              animation: `${knockPeek} ${KNOCK}s linear forwards`,
            }}
          >
            {/* Mirrored so the waving arm is on the open side of the doorway. */}
            <Box sx={{ transform: "scaleX(-1)" }}>
              {visitor === "nurse" ? (
                // Scaled about her feet so she still stands on the threshold.
                <Box sx={{ transform: "scale(0.85)", transformOrigin: "50% 92.5%" }}>
                  <NursePose />
                </Box>
              ) : (
                <Figure>
                  <Arm {...LEFT_ARM_DOWN} />
                  <Arm d="M83 78 Q99 66 99 46" hand={[99, 40]} className="wave" />
                </Figure>
              )}
            </Box>
          </Box>
        </Box>
      )}
      <Box
        key={knock}
        onAnimationEnd={onKnockEnd}
        sx={{
          position: "absolute",
          left: DOOR_FRAME,
          top: DOOR_FRAME,
          width: inner,
          height: leafH,
          transformOrigin: "100% 50%",
          animation: knocking
            ? `${knockSwing} ${KNOCK}s linear forwards`
            : entering
              ? `${doorSwing} ${ENTRY}s linear forwards`
              : "none",
        }}
      >
        <svg width={inner} height={leafH} style={{ display: "block" }}>
          <rect width={inner} height={leafH} fill="#ffffff" stroke={COAT_LINE} strokeWidth="2" />
          <rect x="14" y="16" width={inner - 28} height={leafH * 0.38} rx="3" fill="#ffffff" stroke={COAT_LINE} strokeWidth="1.5" />
          <rect x="14" y={leafH * 0.5} width={inner - 28} height={leafH * 0.44} rx="3" fill="#ffffff" stroke={COAT_LINE} strokeWidth="1.5" />
          <rect x="20" y="52" width={inner - 40} height="24" rx="3" fill="#e1f5fe" stroke="#81d4fa" strokeWidth="1.5" />
          <text
            x={inner / 2}
            y="64"
            textAnchor="middle"
            dominantBaseline="central"
            textLength={inner - 50}
            lengthAdjust="spacingAndGlyphs"
            fontFamily="Arial, sans-serif"
            fontSize="12"
            fontWeight="bold"
            fill={SCRUBS_DARK}
          >
            {t("doorSign")}
          </text>
          <circle cx="14" cy={leafH * 0.46} r="5" fill={METAL} stroke={STETH} strokeWidth="1.5" />
        </svg>
        <TouchAppRoundedIcon
          sx={{
            position: "absolute",
            left: "50%",
            top: leafH * 0.72,
            fontSize: 44,
            color: "#1e88e5",
            animation: `${tapHint} 1.4s ease-in-out infinite`,
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * A cheerful pediatrician who peeks out from under the app bar, climbs down, walks to the middle of the screen,
 * looks around through his stethoscope, and walks off to the right through a door that opens for him and stays shut behind him.
 * The door pops up when he starts climbing down. Clicking it while he is still on his way brings the nurse out to wave; if she is
 * still in the doorway when he reaches it, he waits for her. Once he is inside, clicks alternate between him and the nurse.
 */
export default function WalkingPediatrician({ top }) {
  const [arrived, setArrived] = useState(false);
  const [doorDue, setDoorDue] = useState(false);
  const [doorShown, setDoorShown] = useState(false);
  const [knock, setKnock] = useState(0);
  const [knocking, setKnocking] = useState(false);
  const [visitor, setVisitor] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDoorDue(true), T_DOOR_OPEN * 1000);
    const shownTimer = setTimeout(() => setDoorShown(true), (T_DROP + DOOR_APPEAR) * 1000);
    return () => {
      clearTimeout(timer);
      clearTimeout(shownTimer);
    };
  }, []);

  const waiting = doorDue && knocking && !arrived;
  const entering = doorDue && !knocking && !arrived;
  const clickable = doorShown && !knocking && !entering;

  const handleKnock = () => {
    if (!clickable) return;
    setVisitor(arrived ? (visitor === "doctor" ? "nurse" : "doctor") : "nurse");
    setKnocking(true);
    setKnock((n) => n + 1);
  };

  return (
    <Box
      aria-hidden
      sx={{
        "--bar": `${top}px`,
        position: "fixed",
        top,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        overflow: "hidden",
        pointerEvents: "none",
        // Soft honeydew (#f0fff0) glow that follows the figure's outline.
        filter: "drop-shadow(0 0 8px rgba(240, 255, 240, 0.95)) drop-shadow(0 0 18px rgba(240, 255, 240, 0.75))",
        "& .leg-l": limb(legLift, "alternate"),
        "& .leg-r": limb(legLift, "alternate-reverse"),
        "& .arm-l": limb(armSwing, "alternate-reverse"),
        "& .arm-r": limb(armSwing, "alternate"),
        "& .side-a": limb(sideSwing, "alternate"),
        "& .side-b": limb(sideSwing, "alternate-reverse"),
        "& .wave": {
          transformBox: "fill-box",
          transformOrigin: "0% 100%",
          animation: `${wave} 0.8s ease-in-out infinite`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transformOrigin: `calc(50% + ${DOOR_X}) calc(100% - ${DOOR_BOTTOM}px)`,
          animation: `${doorAppear} ${DOOR_APPEAR}s linear ${T_DROP}s both`,
        }}
      >
        <Door
          knock={knock}
          visitor={visitor}
          knocking={knocking}
          entering={entering}
          clickable={clickable}
          onKnock={handleKnock}
          onKnockEnd={() => setKnocking(false)}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: "25%",
          width: WIDTH,
          height: HEIGHT,
          transform: PEEK_HIDDEN,
          animation: `${peek} ${DURATION}s linear forwards`,
        }}
      >
        <Figure>
          <circle cx="31" cy="68" r="6" fill={SKIN} />
          <circle cx="89" cy="68" r="6" fill={SKIN} />
        </Figure>
      </Box>
      <Box
        onAnimationEnd={(event) => event.target === event.currentTarget && setArrived(true)}
        sx={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: WIDTH,
          height: HEIGHT,
          transformOrigin: "50% 100%",
          transform: HIDDEN_UP,
          animation: `${path} ${DURATION}s linear forwards`,
          // Freezes him mid-stride while the nurse is still in the doorway; !important beats the children's own animation shorthands.
          "&, & *": { animationPlayState: waiting ? "paused !important" : undefined },
        }}
      >
        <Box sx={layer(walkFrames)}>
          <Box sx={{ animation: `${bob} ${STEP}s ease-in-out infinite` }}>
            <Figure walking>
              <Arm {...LEFT_ARM_DOWN} className="arm-l" />
              <Arm {...RIGHT_ARM_DOWN} className="arm-r" />
            </Figure>
          </Box>
        </Box>
        <Box sx={layer(lookFrames)}>
          <Box sx={{ transformOrigin: "50% 100%", animation: `${tilt} 1.6s ease-in-out infinite` }}>
            <LookPose />
          </Box>
        </Box>
        <Box sx={layer(sideFrames)}>
          <Box sx={{ animation: `${bob} ${STEP}s ease-in-out infinite` }}>
            <SidePose />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
