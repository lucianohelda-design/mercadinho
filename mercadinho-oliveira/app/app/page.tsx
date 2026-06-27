'use client'
import Nav from '@/components/Nav'
import StatCard from '@/components/StatCard'
import SimpleBar from '@/components/SimpleBar'
import { supabase } from '@/lib/supabase'
import { brl, monthStartIso, todayStartIso } from '@/lib/format'
import { requireUser } from '@/lib/auth'
import { useEffect,useMemo,useState } from 'react'
import Link from 'next/link'
import { LogOut, Plus, ScanLine, AlertTriangle, ShoppingCart, WalletCards } from 'lucide-react'

function labelDia(d: Date){return d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}
const round2 = (n:number) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100

export default function Dashboard(){
  const [vendasHoje,setVendasHoje] = useState<any[]>([])
  const [vendasMes,setVendasMes] = useState<any[]>([])
  const [itens,setItens] = useState<any[]>([])
  const [produtos,setProdutos] = useState<any[]>([])
  const [fiados,setFiados] = useState<any[]>([])
  const [contasPagar,setContasPagar] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  async function load(){
    setLoading(true)
    await requireUser()
    const [vh,vm,i,p,f,cp] = await Promise.all([
      supabase.from('vendas').select('*').gte('created_at',todayStartIso()).order('created_at',{ascending:false}),
      supabase.from('vendas').select('*').gte('created_at',monthStartIso()).order('created_at',{ascending:false}),
      supabase.from('itens_venda').select('*').gte('created_at',monthStartIso()).limit(5000),
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('fiados').select('*').eq('status','aberto'),
      supabase.from('contas_pagar').select('*').eq('status','aberta')
    ])
    setVendasHoje(vh.data || [])
    setVendasMes(vm.data || [])
    setItens(i.data || [])
    setProdutos(p.data || [])
    setFiados(f.data || [])
    setContasPagar(cp.data || [])
    setLoading(false)
  }

  useEffect(()=>{load()},[])

  const totalItensPorVenda = useMemo(()=>{
    const mapa:Record<string,number> = {}
    itens.forEach(item=>{ if(item.venda_id) mapa[item.venda_id] = round2((mapa[item.venda_id] || 0) + Number(item.subtotal || 0)) })
    return mapa
  },[itens])

  function totalVenda(v:any){
    const totalBanco = Number(v.total || 0)
    if(totalBanco > 0) return totalBanco
    const subtotalItens = Number(totalItensPorVenda[v.id] || 0)
    return round2(Math.max(0, subtotalItens - Number(v.desconto || 0) + Number(v.acrescimo || 0)))
  }

  const totalHoje = useMemo(()=>vendasHoje.reduce((a,b)=>a + totalVenda(b),0),[vendasHoje,totalItensPorVenda])
  const totalMes = useMemo(()=>vendasMes.reduce((a,b)=>a + totalVenda(b),0),[vendasMes,totalItensPorVenda])
  const lucroMes = useMemo(()=>vendasMes.reduce((a,b)=>a + Number(b.lucro_estimado || 0),0),[vendasMes])
  const emFalta = produtos.filter(p=>p.ativo!==false && Number(p.estoque || 0)<=0)
  const baixo = produtos.filter(p=>p.ativo!==false && Number(p.estoque || 0)>0 && Number(p.estoque || 0)<=Number(p.estoque_minimo || 0))
  const fiadoAberto = fiados.reduce((a,b)=>a + Number(b.valor_aberto ?? b.valor ?? 0),0)
  const pagar = contasPagar.reduce((a,b)=>a + Number(b.valor || 0),0)
  const chart = useMemo(()=>{
    const arr=[] as {label:string,value:number}[]
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0)
      const fim=new Date(d); fim.setDate(fim.getDate()+1)
      const value = vendasMes.filter(v=>{const dt=new Date(v.created_at); return dt>=d&&dt<fim}).reduce((a,v)=>a+totalVenda(v),0)
      arr.push({label:labelDia(d),value})
    }
    return arr
  },[vendasMes,totalItensPorVenda])

  async function sair(){await supabase.auth.signOut();location.href='/'}

  return <main className="page">
    <section className="hero">
      <div className="row">
        <div><div className="pill" style={{background:'rgba(255,255,255,.18)',color:'white'}}>Painel geral</div><h1 className="title mt-2">Mercadinho Oliveira</h1></div>
        <button className="btn2" onClick={sair} title="Sair"><LogOut size={20}/></button>
      </div>
      <p className="mt-2 opacity-90">Resumo rápido para vender, acompanhar caixa e controlar fiado.</p>
    </section>
    {loading&&<div className="card mt-4">Carregando informações...</div>}
    <div className="grid2 mt-4">
      <StatCard label="Vendas hoje" value={brl(totalHoje)} sub={`${vendasHoje.length} venda(s)`}/>
      <StatCard label="Faturamento do mês" value={brl(totalMes)} sub="mês atual"/>
    </div>
    <div className="grid2 mt-3">
      <StatCard label="Lucro estimado" value={brl(lucroMes)} sub="mês atual"/>
      <StatCard label="Clientes devendo" value={brl(fiadoAberto)} sub={`${fiados.length} fiado(s)`}/>
    </div>
    <div className="grid2 mt-3">
      <StatCard label="Produtos em falta" value={emFalta.length} sub={`${baixo.length} com estoque baixo`}/>
      <StatCard label="Contas a pagar" value={brl(pagar)} sub="em aberto"/>
    </div>
    <div className="card mt-4">
      <div className="row"><h2 className="section-title">Ações rápidas</h2><span className="pill">mobile</span></div>
      <div className="grid2 mt-3"><Link className="btn" href="/pdv"><ScanLine size={18}/> Vender agora</Link><Link className="btn2" href="/produtos"><Plus size={18}/> Novo produto</Link></div>
      <div className="grid2 mt-2"><Link className="btn2" href="/financeiro"><WalletCards size={18}/> Caixa/contas</Link><Link className="btn2" href="/clientes"><ShoppingCart size={18}/> Fiado</Link></div>
    </div>
    <div className="card mt-4"><h2 className="section-title mb-3">Vendas dos últimos 7 dias</h2><SimpleBar data={chart}/></div>
    <div className="card mt-4"><div className="row"><h2 className="section-title">Alertas de estoque</h2>{emFalta.length+baixo.length>0?<span className="pill-red pill"><AlertTriangle size={14}/> {emFalta.length+baixo.length}</span>:<span className="pill">Tudo ok</span>}</div>{emFalta.length+baixo.length===0?<p className="subtitle mt-2">Nenhum produto em falta ou abaixo do mínimo.</p>:[...emFalta,...baixo].slice(0,6).map(p=><div key={p.id} className="table-line"><b>{p.nome}</b><p className="subtitle">Estoque {Number(p.estoque||0).toLocaleString('pt-BR')} / mínimo {Number(p.estoque_minimo||0).toLocaleString('pt-BR')}</p></div>)}{emFalta.length+baixo.length>6&&<Link href="/relatorios" className="btn2 w-full mt-3">Ver todos</Link>}</div>
    <Nav/>
  </main>
}
