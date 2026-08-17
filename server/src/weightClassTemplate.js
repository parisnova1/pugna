// Standard amateur boxing weight classes (USA Boxing / AIBA-style), grouped by
// age. Round defaults follow common amateur boxing rules and are editable per
// class after insertion — these are just sensible starting points for quick
// tournament setup.
const ROUND_DEFAULTS = {
  adult: { roundsCount: 3, roundMinutes: 3, restMinutes: 1 },
  youth: { roundsCount: 3, roundMinutes: 2, restMinutes: 1 },
  children: { roundsCount: 3, roundMinutes: 1, restMinutes: 1 },
}

const WEIGHT_LABELS = {
  adult: ['48 KG', '51 KG', '54 KG', '57 KG', '60 KG', '63.5 KG', '67 KG', '71 KG', '75 KG', '80 KG', '86 KG', '92 KG', '92+ KG'],
  youth: ['46 KG', '48 KG', '50 KG', '52 KG', '54 KG', '57 KG', '60 KG', '63 KG', '66 KG', '70 KG', '75 KG', '80 KG', '80+ KG'],
  children: ['30 KG', '32 KG', '34 KG', '36 KG', '38 KG', '40 KG', '42 KG', '44 KG', '46 KG', '48 KG', '50 KG', '50+ KG'],
}

export function boxingTemplate({ ageGroup, gender }) {
  const defaults = ROUND_DEFAULTS[ageGroup] || ROUND_DEFAULTS.adult
  const labels = WEIGHT_LABELS[ageGroup] || WEIGHT_LABELS.adult

  return labels.map((weight, i) => ({
    name: weight,
    ageGroup,
    gender: gender || 'mixed',
    ...defaults,
    sortOrder: i,
  }))
}

export const AGE_GROUPS = Object.keys(ROUND_DEFAULTS)
