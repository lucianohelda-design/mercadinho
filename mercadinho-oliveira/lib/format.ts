export const brl = (n: any) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const num = (n: any) => Number(n || 0).toLocaleString('pt-BR')
export const todayStartIso = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString() }
export const monthStartIso = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() }
export const dateBr = (v: any) => v ? new Date(v).toLocaleString('pt-BR') : ''

export function onlyNumber(v: any) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const raw = String(v ?? '').trim()
  if (!raw) return 0
  const cleaned = raw.replace(/[^0-9,.-]/g, '')
  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')
  let normalized = cleaned
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.')
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export const saleTotal = (v: any) => Number(v?.total_corrigido ?? v?.total ?? 0)
