export const brl = (n: any) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const num = (n: any) => Number(n || 0).toLocaleString('pt-BR')
export const todayStartIso = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString() }
export const monthStartIso = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() }
export const dateBr = (v: any) => v ? new Date(v).toLocaleString('pt-BR') : ''
export const onlyNumber = (v: any) => Number(String(v ?? '').replace(',', '.')) || 0
