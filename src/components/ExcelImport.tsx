import { useState } from 'react'
import type * as XLSXType from 'xlsx'
import { ACCENT as RED, ON_ACCENT, CARD, LINE as BORDER, MUTED, TEXT, FONT_BODY as DISPLAY } from '../theme'

export type ImportedFighter = { name: string; club: string; weight: string; record?: string }

const HEADER_ALIASES: Record<keyof ImportedFighter, string[]> = {
  name: ['name', 'fighter', 'fighter name', 'full name'],
  club: ['club', 'gym', 'team', 'boxclub'],
  weight: ['weight', 'weight class', 'kg', 'weight (kg)'],
  record: ['record', 'w-l', 'w-l-d'],
}

function detectColumns(headerRow: string[]): Partial<Record<keyof ImportedFighter, number>> {
  const normalized = headerRow.map(h => (h || '').toString().trim().toLowerCase())
  const map: Partial<Record<keyof ImportedFighter, number>> = {}

  for (const field of Object.keys(HEADER_ALIASES) as (keyof ImportedFighter)[]) {
    const aliases = HEADER_ALIASES[field]
    const idx = normalized.findIndex(h => aliases.includes(h))
    if (idx !== -1) map[field] = idx
  }
  return map
}

async function parseWorkbook(buffer: ArrayBuffer): Promise<ImportedFighter[]> {
  const XLSX: typeof XLSXType = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
  if (rows.length < 2) return []

  const headerRow = rows[0].map(String)
  const columns = detectColumns(headerRow)
  if (columns.name === undefined || columns.weight === undefined) {
    throw new Error('Could not find "Name" and "Weight" columns in the first row of the sheet.')
  }

  return rows.slice(1).map(row => ({
    name: String(row[columns.name!] ?? '').trim(),
    club: columns.club !== undefined ? String(row[columns.club] ?? '').trim() : '',
    weight: String(row[columns.weight!] ?? '').trim(),
    record: columns.record !== undefined ? String(row[columns.record] ?? '').trim() : '',
  })).filter(f => f.name && f.weight)
}

export default function ExcelImport({ onCancel, onImport }: { onCancel: () => void; onImport: (fighters: ImportedFighter[]) => Promise<void> }) {
  const [rows, setRows] = useState<ImportedFighter[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFile = async (file: File) => {
    setError(null)
    setRows(null)
    setFileName(file.name)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = await parseWorkbook(buffer)
      if (parsed.length === 0) throw new Error('No fighter rows found in that sheet.')
      setRows(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.')
    }
  }

  const confirmImport = async () => {
    if (!rows) return
    setImporting(true)
    setError(null)
    try {
      await onImport(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onCancel}
    >
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: '20px', color: TEXT, width: '100%', maxWidth: '640px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: DISPLAY, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>Import Fighters from Excel</h2>
          <button onClick={onCancel} aria-label="Close" style={{ color: MUTED, padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {!rows && (
          <div>
            <p style={{ fontSize: '14px', color: MUTED, lineHeight: 1.6, marginBottom: '16px' }}>
              Upload a .xlsx or .csv file with columns for the fighter's name, club and weight (any order, any capitalization — a "Record" column is optional).
            </p>
            <label
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', border: `1px dashed ${BORDER}`, padding: '40px 20px', cursor: 'pointer', textAlign: 'center' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" color={MUTED}><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
              <span style={{ fontFamily: DISPLAY, fontSize: '14px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: TEXT }}>Choose a file</span>
              <span style={{ fontFamily: DISPLAY, fontSize: '12px', color: MUTED }}>.xlsx, .xls or .csv</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </label>
          </div>
        )}

        {rows && (
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: MUTED, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {fileName} · {rows.length} fighter{rows.length === 1 ? '' : 's'} found
            </div>
            <div style={{ border: `1px solid ${BORDER}`, marginBottom: '20px', maxHeight: '320px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 90px', backgroundColor: '#F2F0EA', padding: '10px 14px', position: 'sticky', top: 0 }}>
                {['Name', 'Club', 'Weight', 'Record'].map(h => (
                  <div key={h} style={{ fontFamily: DISPLAY, fontSize: '11px', letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {rows.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 90px', padding: '8px 14px', borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: '13px', color: TEXT }}>{r.name}</div>
                  <div style={{ fontSize: '13px', color: MUTED }}>{r.club || '—'}</div>
                  <div style={{ fontSize: '13px', color: TEXT }}>{r.weight}</div>
                  <div style={{ fontSize: '13px', color: MUTED }}>{r.record || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { setRows(null); setFileName('') }}
                style={{ flex: 1, padding: '13px', border: `1px solid ${BORDER}`, borderRadius: '9999px', color: TEXT, fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                Choose Different File
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={importing}
                style={{ flex: 1, padding: '13px', backgroundColor: RED, color: ON_ACCENT, borderRadius: '9999px', fontFamily: DISPLAY, fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: importing ? 0.6 : 1 }}
              >
                {importing ? 'Importing…' : `Import ${rows.length} Fighter${rows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}

        {error && <div style={{ fontFamily: DISPLAY, fontSize: '13px', color: RED, marginTop: '14px' }}>{error}</div>}
      </div>
    </div>
  )
}
