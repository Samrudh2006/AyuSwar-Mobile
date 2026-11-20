// AyuSwar Mobile — custom hand-tuned icon set. 24x24 grid.
// Navy/gold family per icon reference sheets approved by the user on 2026-11-18:
// feature/action glyphs are filled navy (fill=currentColor, inherits context)
// with gold #C8921A secondary elements and the signature swoosh arc; utility
// icons keep the 1.8px rounded-stroke style; wine #B3261E reserved for emergency.
import React from 'react';

const GOLD = '#C8921A';
const WINE = '#B3261E';

// Signature gold swoosh arc under the glyph, from the navy/gold reference icon sheets.
const Swoosh = () => <path d="M4.5 21c4.4 2 10 2.1 15 .3" stroke={GOLD} strokeWidth="1.5" />;

const I = ({ children, size = 24, ...props }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...props}
  >{children}</svg>
);

export const IconHome = (p) => (
  <I {...p}><path d="M3.2 10.6 12 3.4l8.8 7.2" /><path d="M5.4 9.4v9.8c0 .8.6 1.4 1.4 1.4h10.4c.8 0 1.4-.6 1.4-1.4V9.4" /><path d="M9.6 20.4v-5.2c0-.7.5-1.2 1.2-1.2h2.4c.7 0 1.2.5 1.2 1.2v5.2" /></I>
);

export const IconStethoscope = (p) => (
  <I {...p}><path d="M5 3.5v5.2c0 3 2.2 5.3 5.2 5.3s5.2-2.3 5.2-5.3V3.5" /><path d="M5 3.5H3.6M5 3.5h1.4m9-1.4h-1.4m1.4 0h1.4" /><path d="M10.2 14v2.1c0 2.6 2 4.6 4.6 4.6s4.6-2 4.6-4.6v-1.6" /><circle cx="19.4" cy="11.6" r="1.9" stroke={GOLD} /><Swoosh /></I>
);

export const IconMic = (p) => (
  <I {...p}>
    <rect x="13.4" y="3.6" width="7.6" height="11.6" rx="1.5" />
    <path d="M15.2 6.6h4M15.2 9.4h4M15.2 12.2h2.6" stroke={GOLD} strokeWidth="1.3" />
    <rect x="4.2" y="2.6" width="6" height="10.8" rx="3" fill="currentColor" stroke="none" />
    <path d="M1.9 10.4a5.3 5.3 0 0 0 10.6 0" stroke={GOLD} />
    <path d="M7.2 15.7v2.6M4.8 18.3h4.8" strokeWidth="1.7" />
    <Swoosh />
  </I>
);

export const IconWave = (p) => (
  <I {...p}>
    <path d="M3.4 10v4M6.2 7.4v9.2M9 4.6v14.8M11.8 8.2v7.6" strokeWidth="2.1" />
    <circle cx="17.3" cy="10.2" r="3.4" stroke={GOLD} strokeWidth="1.8" />
    <path d="m19.9 12.8 2.3 2.3" stroke={GOLD} strokeWidth="1.8" />
    <Swoosh />
  </I>
);

export const IconScan = (p) => (
  <I {...p}><path d="M3.4 7.6V5.8c0-1.3 1.1-2.4 2.4-2.4h1.8" /><path d="M16.4 3.4h1.8c1.3 0 2.4 1.1 2.4 2.4v1.8" /><path d="M20.6 16.4v1.8c0 1.3-1.1 2.4-2.4 2.4h-1.8" /><path d="M7.6 20.6H5.8c-1.3 0-2.4-1.1-2.4-2.4v-1.8" /><path d="M7 12h10" /><path d="M7 8.8h6M7 15.2h8" /><Swoosh /></I>
);

export const IconSiren = (p) => (
  <I {...p}><path d="M12 3.2c.5 0 .9.4.9.9v1.5" stroke={WINE} /><path d="M5.6 5.6c.4-.4 1-.4 1.3 0l1 1" stroke={WINE} /><path d="M18.4 5.6c-.4-.4-1-.4-1.3 0l-1 1" stroke={WINE} /><path d="M6.8 13.4a5.2 5.2 0 0 1 10.4 0v5.2H6.8z" /><path d="M4 18.6h16c.6 0 1 .4 1 1v.6c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1v-.6c0-.6.4-1 1-1z" /></I>
);

export const IconPill = (p) => (
  <I {...p}>
    <rect x="2.6" y="9.4" width="13.4" height="6.4" rx="3.2" transform="rotate(-45 9.3 12.6)" fill="currentColor" stroke="none" />
    <path d="m7 9.6 4.6 4.6" stroke={GOLD} strokeWidth="1.6" />
    <path d="M18.9 11.4c1.5.3 2.6 1.6 2.6 3.2v1.9l.8 1c.2.4-.1.9-.5.9h-5.4c-.4 0-.7-.5-.5-.9l.8-1v-1.9c0-1.6 1.1-2.9 2.2-3.2z" fill={GOLD} stroke="none" />
    <path d="M18.4 19.4a1 1 0 0 0 2 0" stroke={GOLD} strokeWidth="1.4" />
    <Swoosh />
  </I>
);

export const IconHeart = (p) => (
  <I {...p}><path d="M12 20.2S4.4 15.4 3 10.9C2 7.6 4.2 4.6 7.4 4.6c1.9 0 3.6 1 4.6 2.7 1-1.7 2.7-2.7 4.6-2.7 3.2 0 5.4 3 4.4 6.3-1.4 4.5-9 9.3-9 9.3z" /></I>
);

export const IconPulseHeart = (p) => (
  <I {...p}>
    <path d="M2.6 12.6h3.4l1.6-4.2c.2-.6 1-.6 1.3 0l3 8.6c.3.6 1.1.6 1.3 0l1.5-4.4h2.1" strokeWidth="1.9" />
    <path d="M19.4 15.8s-3.2-2-3.2-4.1c0-1.1.9-2 1.9-2 .6 0 1 .3 1.3.7.3-.4.7-.7 1.3-.7 1 0 1.9.9 1.9 2 0 2.1-3.2 4.1-3.2 4.1z" fill={GOLD} stroke="none" />
    <Swoosh />
  </I>
);

export const IconCalendar = (p) => (
  <I {...p}>
    <rect x="3.2" y="4.6" width="14.6" height="15.2" rx="2.2" />
    <path d="M3.2 9.2h14.6" />
    <path d="M7.2 2.8v3.4M13.8 2.8v3.4" strokeWidth="2" />
    <path d="M6 12.4h2.6M6 15.6h2.6M10.4 12.4h2.6" strokeWidth="1.5" />
    <circle cx="17.2" cy="16.4" r="4.1" fill={GOLD} stroke="none" />
    <path d="M17.2 13.9v2.5l1.7 1" stroke="#FFFDF6" strokeWidth="1.5" />
    <Swoosh />
  </I>
);

export const IconFile = (p) => (
  <I {...p}>
    <rect x="2.6" y="5" width="18.8" height="13.6" rx="2.2" />
    <circle cx="7.8" cy="10.2" r="1.9" fill="currentColor" stroke="none" />
    <path d="M4.6 15.6c.4-1.7 1.6-2.6 3.2-2.6s2.8.9 3.2 2.6" stroke="currentColor" strokeWidth="1.7" />
    <path d="M13.2 8.8h5.4M13.2 11.8h5.4M13.2 14.8h3.6" stroke={GOLD} strokeWidth="1.4" />
    <Swoosh />
  </I>
);

export const IconUpload = (p) => (
  <I {...p}><path d="M12 15.6V4.4" /><path d="m7.6 8.8 4.4-4.4 4.4 4.4" /><path d="M4.4 15.6v2.8c0 1.3 1.1 2.4 2.4 2.4h10.4c1.3 0 2.4-1.1 2.4-2.4v-2.8" /></I>
);

export const IconUser = (p) => (
  <I {...p}>
    <circle cx="12" cy="7.2" r="3.4" fill="currentColor" stroke="none" />
    <path d="M5 19.6c.9-3.6 3.8-5.6 7-5.6s6.1 2 7 5.6c.1.6-.3 1.1-1 1.1H6c-.7 0-1.1-.5-1-1.1z" fill="currentColor" stroke="none" />
    <path d="M12 18.6s-1.9-1.2-1.9-2.4c0-.7.5-1.2 1.1-1.2.3 0 .6.2.8.4.2-.2.5-.4.8-.4.6 0 1.1.5 1.1 1.2 0 1.2-1.9 2.4-1.9 2.4z" fill={GOLD} stroke="none" />
    <Swoosh />
  </I>
);

export const IconUsers = (p) => (
  <I {...p}><circle cx="9" cy="8.4" r="3.2" /><path d="M3.4 19.8c.7-3 3-4.8 5.6-4.8s4.9 1.8 5.6 4.8" /><path d="M15.4 5.6a3.2 3.2 0 0 1 0 5.8" /><path d="M17.2 15.3c1.7.6 2.9 2 3.4 4" /></I>
);

export const IconMenu = (p) => (
  <I {...p}><path d="M4 7h16M4 12h16M4 17h10" /></I>
);

export const IconClose = (p) => (
  <I {...p}><path d="m6 6 12 12M18 6 6 18" /></I>
);

export const IconChevronR = (p) => (
  <I {...p}><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></I>
);

export const IconBack = (p) => (
  <I {...p}><path d="M14.5 5.5 8 12l6.5 6.5" /></I>
);

export const IconGlobe = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.6" /><path d="M3.4 12h17.2" stroke={GOLD} /><path d="M12 3.4c-2.4 2.2-3.7 5.2-3.7 8.6s1.3 6.4 3.7 8.6c2.4-2.2 3.7-5.2 3.7-8.6s-1.3-6.4-3.7-8.6z" /></I>
);

export const IconHospital = (p) => (
  <I {...p}><path d="M4 20.6V6.2c0-1 .8-1.8 1.8-1.8h8.4c1 0 1.8.8 1.8 1.8v14.4" /><path d="M16 9.4h2.4c1 0 1.8.8 1.8 1.8v9.4" /><path d="M3 20.6h18" /><path d="M9.8 8h.2M9.8 11.4h.2M9.8 14.8h.2M13.2 8h.2M13.2 11.4h.2" /><path d="M8.4 20.6v-3c0-.7.5-1.2 1.2-1.2h.8c.7 0 1.2.5 1.2 1.2v3" /></I>
);

export const IconPhone = (p) => (
  <I {...p}>
    <path d="M6.8 3.4c.6-.5 1.5-.4 2 .2l1.7 2.1c.4.6.4 1.4-.1 1.9l-1.1 1.2c.9 2 2.4 3.5 4.4 4.4l1.2-1.1c.5-.5 1.3-.5 1.9-.1l2.1 1.7c.6.5.7 1.4.2 2l-1.2 1.4c-.6.7-1.6 1-2.4.8C10 16.4 6.6 13 6.1 7.5c-.2-.8.1-1.7.7-2.3z" fill="currentColor" stroke="none" />
    <path d="M13.6 3.2c2.6.8 4.5 2.7 5.3 5.3M13.2 6.2c1.5.6 2.6 1.7 3.2 3.2" stroke={GOLD} />
    <Swoosh />
  </I>
);

export const IconShield = (p) => (
  <I {...p}>
    <path d="M12 2.8 4.8 5.4v5.8c0 4.6 3 8.1 7.2 9.9 4.2-1.8 7.2-5.3 7.2-9.9V5.4z" fill="currentColor" stroke="none" />
    <rect x="9" y="10.6" width="6" height="5" rx="1.2" fill={GOLD} stroke="none" />
    <path d="M10.2 10.6V9.4a1.8 1.8 0 0 1 3.6 0v1.2" stroke={GOLD} strokeWidth="1.5" />
    <Swoosh />
  </I>
);

export const IconLab = (p) => (
  <I {...p}><path d="M9.4 3.4h5.2" /><path d="M10.4 3.4v5L5.2 17.6c-.9 1.4.2 3.2 1.9 3.2h9.8c1.7 0 2.8-1.8 1.9-3.2L13.6 8.4v-5" /><path d="M7.6 14.4h8.8" /><Swoosh /></I>
);

export const IconBook = (p) => (
  <I {...p}><path d="M4.6 5.4c0-1 .8-1.8 1.8-1.8H19.4v14.8H6.4c-1 0-1.8.8-1.8 1.8z" /><path d="M4.6 18.4c0 1 .8 1.8 1.8 1.8h13" /><path d="M8.6 7.6h6.8" /></I>
);

export const IconSettings = (p) => (
  <I {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /><Swoosh /></I>
);

export const IconInfo = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.6" /><path d="M12 11v5" /><path d="M12 7.6h.2" /></I>
);

export const IconPlay = (p) => (
  <I {...p}><path d="M8 5.4v13.2c0 .9 1 1.5 1.8 1l10.2-6.6c.7-.5.7-1.5 0-2L9.8 4.4C9 3.9 8 4.5 8 5.4z" /></I>
);

export const IconStop = (p) => (
  <I {...p}><rect x="6" y="6" width="12" height="12" rx="2.4" /></I>
);

export const IconSend = (p) => (
  <I {...p}><path d="M20.4 3.6 10.2 13.8" /><path d="M20.4 3.6 14 20.4c-.2.6-1 .7-1.4.2l-2.4-3.4-3.4-2.4c-.5-.4-.4-1.2.2-1.4z" /></I>
);

export const IconCamera = (p) => (
  <I {...p}><path d="M4 8.4c0-1 .8-1.8 1.8-1.8h2l1.4-2.2c.3-.4.7-.7 1.2-.7h3.2c.5 0 .9.3 1.2.7l1.4 2.2h2c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8z" /><circle cx="12" cy="12.8" r="3.4" /></I>
);

export const IconClock = (p) => (
  <I {...p}><circle cx="12" cy="12" r="8.6" /><path d="M12 6.8V12l3.4 2" /></I>
);

export const IconBell = (p) => (
  <I {...p}><path d="M18.4 15.4v-5.2c0-3.4-2.5-6.3-6-6.8a.6.6 0 0 0-.8 0c-3.5.5-6 3.4-6 6.8v5.2l-1.8 2.4c-.3.5.1 1.2.7 1.2h15c.6 0 1-.7.7-1.2z" /><path d="M9.8 19a2.4 2.4 0 0 0 4.4 0" stroke={GOLD} /><Swoosh /></I>
);

export const IconMapPin = (p) => (
  <I {...p}><path d="M12 21s-6.6-5.4-6.6-10.4a6.6 6.6 0 0 1 13.2 0C18.6 15.6 12 21 12 21z" /><circle cx="12" cy="10.4" r="2.4" /></I>
);

export const IconLogout = (p) => (
  <I {...p}><path d="M14 3.6H6.8c-1 0-1.8.8-1.8 1.8v13.2c0 1 .8 1.8 1.8 1.8H14" /><path d="m16.8 8.4 3.6 3.6-3.6 3.6" /><path d="M20.4 12H9.6" /><Swoosh /></I>
);

export const IconDiya = (p) => (
  <I {...p}><path d="M12 3.4c1.2 1.6 1.9 2.8 1.9 4a1.9 1.9 0 0 1-3.8 0c0-1.2.7-2.4 1.9-4z" /><path d="M4.4 12.6c1.6 1 4.2 1.6 7.6 1.6s6-.6 7.6-1.6c-.4 3.8-3.6 6.6-7.6 6.6s-7.2-2.8-7.6-6.6z" /><path d="M8 21.4h8" /></I>
);

export const IconLeaf = (p) => (
  <I {...p}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19c3-5 7-9 11-11" /></I>
);

export const IconAmbulance = (p) => (
  <I {...p}><path d="M3 7.2c0-.7.5-1.2 1.2-1.2h9.6c.7 0 1.2.5 1.2 1.2V16H3z" /><path d="M15 9.6h2.8c.4 0 .8.2 1 .6l1.8 3c.1.2.2.5.2.7V16h-5.8" /><path d="M3 16h18v1.4c0 .7-.5 1.2-1.2 1.2H4.2c-.7 0-1.2-.5-1.2-1.2z" /><path d="M8 9.6v3M6.5 11.1h3" /><circle cx="7.4" cy="18.6" r="1.6" /><circle cx="16.6" cy="18.6" r="1.6" /></I>
);

export const IconTranslate = (p) => (
  <I {...p}><path d="M4 5.6h9.6" /><path d="M8.8 3.6v2" /><path d="M11.2 5.6c-.8 3.6-3 6.8-6 8.8" /><path d="M6 8.8c1 2.6 2.8 4.6 5.2 5.8" /><path d="m12.4 20 3.6-8.4c.2-.6 1-.6 1.2 0L20.8 20" /><path d="M13.8 16.4h5.2" /></I>
);

export const IconDatabase = (p) => (
  <I {...p}><ellipse cx="12" cy="5.6" rx="7.4" ry="2.6" /><path d="M4.6 5.6v12.8c0 1.4 3.3 2.6 7.4 2.6s7.4-1.2 7.4-2.6V5.6" /><path d="M4.6 12c0 1.4 3.3 2.6 7.4 2.6s7.4-1.2 7.4-2.6" /></I>
);

export const IconChart = (p) => (
  <I {...p}><path d="M4 4v14.4c0 .9.7 1.6 1.6 1.6H20" /><path d="M8 15.6v-4M12 15.6V8M16 15.6v-6.4" /></I>
);

export const IconCpu = (p) => (
  <I {...p}><rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2" /><path d="M10 10.4h4v3.2h-4z" /><path d="M9.4 3v3.4M14.6 3v3.4M9.4 17.6V21M14.6 17.6V21M3 9.4h3.4M3 14.6h3.4M17.6 9.4H21M17.6 14.6H21" /></I>
);

export const IconSpeaker = (p) => (
  <I {...p}><path d="M4 9.6v4.8c0 .7.5 1.2 1.2 1.2h2.4l4.6 3.8c.6.5 1.6.1 1.6-.7V5.3c0-.8-1-1.2-1.6-.7L7.6 8.4H5.2c-.7 0-1.2.5-1.2 1.2z" /><path d="M16.8 8.8a4.4 4.4 0 0 1 0 6.4" /><path d="M19.2 6.4a8 8 0 0 1 0 11.2" /><Swoosh /></I>
);
