'use client'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'
import { brl, dateBr, onlyNumber } from '@/lib/format'
import { requireUser } from '@/lib/auth'
import { useEffect,useMemo,useState } from 'react'
import { CheckCircle2, Edit3, Users } from 'lucide-react'

const vazio = {id:'',nome:'',telefone:'',limite_fiado:'0'}
const round2 = (n:number) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100

export default function Clientes(){
  const [form,setForm] = useState<any>(vazio)
  const [busca,setBusca] = useState('')
  const [clientes,setClientes] = useState<any[]>([])
  const [fiados,setFiados] = useState<any[]>([])
  const [vendas,setVendas] = useState<any[]>([])
  const [itens,setItens] = useState<any[]>([])
  const [selecionado,setSelecionado] = useState<any>(null)

  async function load(){
    await requireUser()
    const [c,f,v,i] = await Promise.all([
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('fiados').select('*').order('created_at',{ascending:false}),
      supabase.from('vendas').select('*').order('created_at',{ascending:false}).limit(250),
      supabase.from('itens_venda').select('*').order('created_at',{ascending:false}).limit(5000)
    ])
    setClientes(c.data || [])
    setFiados(f.data || [])
    setVendas(v.data || [])
    setItens(i.data || [])
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

  async function salvar(e:any){
    e.preventDefault()
    if(!form.nome.trim()) return alert('Informe o nome.')
    const payload = {nome:form.nome.trim(),telefone:form.telefone.trim() || null,limite_fiado:onlyNumber(form.limite_fiado)}
    const resp = form.id ? await supabase.from('clientes').update(payload).eq('id',form.id) : await supabase.from('clientes').insert(payload)
    if(resp.error) return alert(resp.error.message)
    setForm(vazio)
    load()
  }

  function editar(c:any){setForm({id:c.id,nome:c.nome || '',telefone:c.telefone || '',limite_fiado:String(c.limite_fiado || 0)});scrollTo({top:0,behavior:'smooth'})}

  async function quitar(f:any){
    const valor = Number(f.valor_aberto ?? f.valor ?? 0)
    if(!confirm(`Confirmar pagamento de ${brl(valor)}?`)) return
    await supabase.from('pagamentos_fiado').insert({fiado_id:f.id,cliente_id:f.cliente_id,valor,forma_pagamento:'dinheiro'})
    await supabase.from('fiados').update({status:'quitado',valor_aberto:0}).eq('id',f.id)
    load()
  }

  const filtrados = clientes.filter(c=>!busca.trim() || `${c.nome} ${c.telefone || ''}`.toLowerCase().includes(busca.toLowerCase()))
  const totalAberto = fiados.filter(f=>f.status==='aberto').reduce((a,b)=>a + Number(b.valor_aberto ?? b.valor ?? 0),0)
  const dadosCliente = selecionado || filtrados[0]
  const fiadosCliente = dadosCliente ? fiados.filter(f=>f.cliente_id===dadosCliente.id || f.cliente_nome===dadosCliente.nome) : []
  const vendasCliente = dadosCliente ? vendas.filter(v=>v.cliente_id===dadosCliente.id || v.cliente_nome===dadosCliente.nome) : []

  return <main className="page"><div className="row"><div><h1 className="title">Clientes</h1><p className="subtitle">Fiado, histórico e pagamentos.</p></div><div className="pill"><Users size={15}/> {clientes.length}</div></div>
    <div className="grid2 mt-4"><div className="card"><small>Fiado aberto</small><div className="money">{brl(totalAberto)}</div></div><div className="card"><small>Clientes</small><div className="money">{clientes.length}</div></div></div>
    <form onSubmit={salvar} className="card space-y-2 mt-4"><h2 className="section-title">{form.id?'Editar cliente':'Novo cliente'}</h2><input className="input" placeholder="Nome" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/><input className="input" placeholder="Telefone" value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})}/><input className="input" type="number" step="0.01" placeholder="Limite de fiado" value={form.limite_fiado} onChange={e=>setForm({...form,limite_fiado:e.target.value})}/><button className="btn w-full">{form.id?'Salvar alterações':'Salvar cliente'}</button>{form.id&&<button type="button" className="btn2 w-full" onClick={()=>setForm(vazio)}>Cancelar edição</button>}</form>
    <div className="card mt-4"><input className="input" placeholder="Buscar cliente" value={busca} onChange={e=>setBusca(e.target.value)}/></div>
    <h2 className="section-title mt-5">Clientes cadastrados</h2>{filtrados.map(c=><div className="card mt-2" key={c.id}><div className="row"><div><b>{c.nome}</b><p className="subtitle">{c.telefone||'Sem telefone'} • Limite {brl(c.limite_fiado)}</p></div><button className="btn2" onClick={()=>editar(c)}><Edit3 size={16}/></button></div><button className="btn2 w-full mt-3" onClick={()=>setSelecionado(c)}>Ver fiado e histórico</button></div>)}
    {dadosCliente&&<div className="card mt-5"><h2 className="section-title">Histórico de {dadosCliente.nome}</h2><h3 className="font-black mt-4">Fiados</h3>{fiadosCliente.length===0&&<p className="subtitle">Nenhum fiado para este cliente.</p>}{fiadosCliente.map(f=><div className="card-line" key={f.id}><div className="row"><div><b>{brl(f.valor_aberto ?? f.valor)}</b><p className="subtitle">{dateBr(f.created_at)} • {f.status}</p></div>{f.status==='aberto'&&<button className="btn" onClick={()=>quitar(f)}><CheckCircle2 size={16}/> Quitar</button>}</div></div>)}<h3 className="font-black mt-4">Compras</h3>{vendasCliente.length===0&&<p className="subtitle">Nenhuma venda registrada para este cliente.</p>}{vendasCliente.slice(0,30).map(v=><div className="card-line" key={v.id}><div className="row"><b>{brl(totalVenda(v))}</b><span className="pill">{v.forma_pagamento}</span></div><p className="subtitle">{dateBr(v.created_at)}</p></div>)}</div>}
    <Nav/></main>
}
