import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { apiFetch } from '../lib/api'

const BORDER = '#333333'
const DISPLAY = "'Geist Sans', sans-serif"

type GeoResult = { label: string; lat: string; lon: string }

export default function LocationInput({ value, onChange, onSelect, placeholder, inputStyle }: {
  value: string
  onChange: (v: string) => void
  onSelect?: (result: { label: string; lat: number; lon: number }) => void
  placeholder?: string
  inputStyle: CSSProperties
}) {
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => {
      apiFetch<{ results: GeoResult[] }>(`/api/geo/search?q=${encodeURIComponent(value.trim())}`)
        .then(r => setResults(r.results))
        .catch(() => setResults([]))
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value])

  return (
    <div style={{ position: 'relative' }}>
      <input
        style={inputStyle}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#0a0a0a', border: `1px solid ${BORDER}`, zIndex: 20, maxHeight: '220px', overflowY: 'auto' }}>
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => { onChange(r.label); onSelect?.({ label: r.label, lat: Number(r.lat), lon: Number(r.lon) }); setOpen(false); setResults([]) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontFamily: DISPLAY, fontSize: '13px', color: '#ccc', letterSpacing: '0.02em', borderBottom: `1px solid ${BORDER}` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#161616')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
