// Shared design tokens — the app's one visual language (editorial paper: warm
// canvas, ink text, a serif display face, dust-lilac accent). Originally built
// for the marketing landing page alone (see git history on Home.tsx), then
// promoted here once the whole app adopted the same look, replacing the old
// per-file copy-pasted dark-theme hex constants (RED/CARD/BORDER/MUTED/DISPLAY).
export const BG = '#EFEDE8'
export const CARD = '#FFFFFF'
export const TEXT = '#111114'
export const MUTED = 'rgba(17,17,20,0.62)'
export const NAV_BG = '#0A0A0A'
export const ACCENT = '#C5B4E3'
export const ACCENT_SOFT = '#DCD1EC'
export const ON_ACCENT = '#111114'
export const LINE = 'rgba(17,17,20,0.12)'

export const FONT_DISPLAY = "'Newsreader', Georgia, 'Times New Roman', serif"
export const FONT_BODY = "'Geist Sans', sans-serif"
export const FONT_MONO = "'Geist Mono', monospace"

// Semantic status colors — not thematic, unchanged by the re-theme.
export const LIVE_RED = '#ff453a'
export const CAUTION_AMBER = '#ff9f0a'
export const POSITIVE_GREEN = '#30d158'
