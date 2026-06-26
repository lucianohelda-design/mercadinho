'use client'
import { brl } from '@/lib/format'
export default function SimpleBar({data}:{data:{label:string,value:number}[]}){
  const max = Math.max(1, ...data.map(d=>Number(d.value||0)))
  return <div className="chart-card">
    {data.map((d,i)=><div key={i} className="bar-row">
      <span className="bar-label">{d.label}</span>
      <div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(5,(d.value/max)*100)}%`}} /></div>
      <span className="bar-value">{brl(d.value)}</span>
    </div>)}
  </div>
}
