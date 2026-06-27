'use client'
import Nav from '@/components/Nav'
import SimpleBar from '@/components/SimpleBar'
import { supabase } from '@/lib/supabase'
import { brl, dateBr } from '@/lib/format'
import { requireUser } from '@/lib/auth'
import { useEffect,useMemo,useState } from 'react'

const round2 = (n:number) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100

export default function Relatorios(){
  const [vendas,setVendas] = useState<any[]>([])
  const [itens,setItens] = useState<any[]>([])
  const [produtos,setProdutos] = useState<any[]>([])
  const [fiados,setFiados] = useState<any[]>([])
  const [busca,setBusca] = useState('')
  const [periodo,setPeriodo] = useState('30')
  const [msg,setMsg] = useState('')

  async function load(){
    await requireUser()
    setMsg('')
    const [v,i,p,f] = await Promise.all([
      supabase.from('vendas').select('*').order('created_at',{ascending:false}).limit(1000),
      supabase.from('itens_venda').select('*').order('created_at',{ascending:false}).limit(5000),
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('fiados').select('*')
    ])
    const erro = v.error || i.error || p.error || f.error
    if (erro) setMsg(erro.message)
    setVendas(v.data || [])
    setItens(i.data || [])
    setProdutos(p.data || [])
    setFiados(f.data || [])
  }

  useEffect(()=>{load()},[])

  const totalItensPorVenda = useMemo(()=>{
    const mapa:Record<string,number> = {}
    itens.forEach(item=>{
      const id = item.venda_id
      if(!id) return
      mapa[id] = round2((mapa[id] || 0) + Number(item.subtotal || 0))
    })
    return mapa
  },[itens])

  function totalVenda(v:any){
    const totalBanco = Number(v.total || 0)
    if(totalBanco > 0) return totalBanco
    const subtotalItens = Number(totalItensPorVenda[v.id] || 0)
    if(subtotalItens > 0) return round2(Math.max(0, subtotalItens - Number(v.desconto || 0) + Number(v.acrescimo || 0)))
    return 0
  }

  const vendasFiltradas = useMemo(()=>{
    if(periodo === 'todos') return vendas
    const inicio = new Date()
    if(periodo === 'hoje') inicio.setHours(0,0,0,0)
    else inicio.setDate(inicio.getDate() - Number(periodo))
    return vendas.filter(v=>new Date(v.created_at) >= inicio)
  },[vendas,periodo])

  const totalVendido = vendasFiltradas.reduce((a,v)=>a + totalVenda(v),0)
  const lucro = vendasFiltradas.reduce((a,v)=>a + Number(v.lucro_estimado || 0),0)
  const custoEstoque = produtos.reduce((a,p)=>a + Number(p.estoque || 0) * Number(p.preco_custo || 0),0)
  const vendaEstoque = produtos.reduce((a,p)=>a + Number(p.estoque || 0) * Number(p.preco_venda || 0),0)
  const qtdEstoque = produtos.reduce((a,p)=>a + Number(p.estoque || 0),0)
  const estoqueBaixo = produtos.filter(p=>Number(p.estoque || 0) <= Number(p.estoque_minimo || 0))
  const aberto = fiados.filter(f=>f.status==='aberto').reduce((a,f)=>a + Number(f.valor_aberto ?? f.valor ?? 0),0)
  const produtosFiltrados = produtos.filter(p=>!busca.trim() || `${p.nome} ${p.codigo_barras || ''} ${p.categoria || ''}`.toLowerCase().includes(busca.toLowerCase()))

  const chart = useMemo(()=>{
    const mapa:Record<string,number> = {}
    vendasFiltradas.forEach(v=>{
      const d = new Date(v.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
      mapa[d] = (mapa[d] || 0) + totalVenda(v)
    })
    return Object.entries(mapa).slice(0,12).reverse().map(([label,value])=>({label,value}))
  },[vendasFiltradas,totalItensPorVenda])

  function csv(){
    const linhas = [
      'Nome,Codigo,Categoria,Estoque,Custo,Venda,Total Custo,Total Venda',
      ...produtos.map(p=>`"${p.nome}","${p.codigo_barras || ''}","${p.categoria || ''}",${p.estoque || 0},${p.preco_custo || 0},${p.preco_venda || 0},${Number(p.estoque || 0) * Number(p.preco_custo || 0)},${Number(p.estoque || 0) * Number(p.preco_venda || 0)}`)
    ]
    const blob = new Blob([linhas.join('\n')],{type:'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-estoque-mercadinho-oliveira.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return <main className="page">
    <h1 className="title">Relatórios</h1>
    <p className="subtitle">Vendas, estoque, lucro e fiado.</p>
    {msg&&<p className="alert mt-3">{msg}</p>}

    <div className="card mt-4">
      <select className="select" value={periodo} onChange={e=>setPeriodo(e.target.value)}>
        <option value="hoje">Hoje</option>
        <option value="7">Últimos 7 dias</option>
        <option value="30">Últimos 30 dias</option>
        <option value="todos">Todas as vendas</option>
      </select>
    </div>

    <div className="grid2 mt-3">
      <div className="card"><small>Total vendido</small><div className="money">{brl(totalVendido)}</div><p className="subtitle">{vendasFiltradas.length} venda(s)</p></div>
      <div className="card"><small>Lucro estimado</small><div className="money">{brl(lucro)}</div></div>
    </div>
    <div className="grid2 mt-3">
      <div className="card"><small>Fiado aberto</small><div className="money">{brl(aberto)}</div></div>
      <div className="card"><small>Estoque baixo</small><div className="money">{estoqueBaixo.length}</div></div>
    </div>

    {chart.length>0&&<div className="card mt-4"><h2 className="section-title mb-3">Vendas por dia</h2><SimpleBar data={chart}/></div>}

    <div className="card mt-4 space-y-2">
      <div className="row"><h2 className="section-title">Estoque completo</h2><button className="btn2" onClick={csv}>Exportar CSV</button></div>
      <p>Produtos cadastrados: <b>{produtos.length}</b></p>
      <p>Quantidade total: <b>{qtdEstoque.toLocaleString('pt-BR')}</b></p>
      <p>Valor total pelo custo: <b>{brl(custoEstoque)}</b></p>
      <p>Valor total para venda: <b>{brl(vendaEstoque)}</b></p>
      <p>Lucro bruto previsto no estoque: <b>{brl(vendaEstoque-custoEstoque)}</b></p>
    </div>

    <h2 className="section-title mt-5">Produtos em estoque</h2>
    <div className="card mt-2"><input className="input" placeholder="Filtrar por nome, código ou categoria" value={busca} onChange={e=>setBusca(e.target.value)}/></div>
    {produtosFiltrados.map(p=>{
      const qtd = Number(p.estoque || 0), c = Number(p.preco_custo || 0), v = Number(p.preco_venda || 0)
      return <div className="card mt-2" key={p.id}><div className="row"><div><b>{p.nome}</b><p className="subtitle">{p.codigo_barras || 'Sem código'} • {p.categoria || 'Sem categoria'}</p></div>{qtd<=Number(p.estoque_minimo || 0)&&<span className="pill-red pill">Baixo</span>}</div><div className="grid3 mt-3"><div className="card-soft"><small>Estoque</small><b className="block">{qtd.toLocaleString('pt-BR')}</b></div><div className="card-soft"><small>Total custo</small><b className="block">{brl(qtd*c)}</b></div><div className="card-soft"><small>Total venda</small><b className="block">{brl(qtd*v)}</b></div></div></div>
    })}

    <h2 className="section-title mt-5">Últimas vendas</h2>
    {vendasFiltradas.slice(0,50).map(v=>{
      const totalCorrigido = totalVenda(v)
      const totalBanco = Number(v.total || 0)
      return <div className="card mt-2" key={v.id}><div className="row"><b>{brl(totalCorrigido)}</b><span className="pill">{v.forma_pagamento}</span></div><p className="subtitle">{dateBr(v.created_at)} • lucro {brl(v.lucro_estimado)}</p>{totalBanco<=0&&totalCorrigido>0&&<p className="alert mt-2">Total recuperado pelos itens da venda. Execute o SQL da versão 2.2 para gravar a correção no banco.</p>}{v.cliente_nome&&<p>Cliente: {v.cliente_nome}</p>}</div>
    })}
    {vendasFiltradas.length===0&&<div className="card list-empty mt-2">Nenhuma venda encontrada no período.</div>}
    <Nav/>
  </main>
}
