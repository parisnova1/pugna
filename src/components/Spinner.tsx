import { TEXT } from '../theme'

// Defaults to ink rather than the lilac accent — a pale lilac stroke has too
// little contrast against the canvas background to read as a loading spinner.
export default function Spinner({ size = 16, color = TEXT }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'pugna-spin 0.7s linear infinite', flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
