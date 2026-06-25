'use client'
import Nav from '@/components/Nav'
import Scanner from '@/components/Scanner'
import { supabase } from '@/lib/supabase'
import { brl, onlyNumber } from '@/lib/format'
import { requireUser } from '@/lib/auth'
import { useEffect,useMemo,useState } from 'react'
import { Minus, Plus, ScanLine, Trash2, Search, ShoppingCart, X } from 'lucide-react'

type CartItem={produto_id:string,nome:string,codigo_barras?:string,quantidade:number,preco_unitario:number,preco_custo_unitario:number,desconto:number,estoque:number}
const formas=[['dinheiro','Dinheiro'],['pix','Pix'],['cartao_debito','Débito'],['cartao_credito','Crédito'],['fiado','Fiado']]

export default function PDV(){
  const[produtos,setProdutos]=useState<any[]>([])
  const[clientes,setClientes]=useState<any[]>([])
  const[busca,setBusca]=useState('')
  const[codigo,setCodigo]=useState('')
  const[cart,setCart]=useState<CartItem[]>([])
  const[scanner,setScanner]=useState(false)
  const[forma,setForma]=useState('dinheiro')
  const[clienteId,setClienteId]=useState('')
  const[descontoVenda,setDescontoVenda]=useState('0')
  const[valorRecebido,setValorRecebido]=useState('0')
  const[loading,setLoading]=useState(false)
  const[msg,setMsg]=useState('')
  async function load(){await requireUser(); const[p,c]=await Promise.all([supabase.from('produtos').select('*').eq('ativo',true).order('nome'),supabase.from('clientes').select('*').order('nome')]); setProdutos(p.data||[]); setClientes(c.data||[])}
  useEffect(()=>{load()},[])
  const filtrados=useMemo(()=>{const t=busca.trim().toLowerCase(); if(!t)return produtos.slice(0,20); return produtos.filter(p=>`${p.nome} ${p.codigo_barras||''}`.toLowerCase().includes(t)).slice(0,30)},[produtos,busca])
  const subtotal=cart.reduce((a,i)=>a+(i.quantidade*i.preco_unitario)-Number(i.desconto||0),0)
  const desconto=onlyNumber(descontoVenda)
  const total=Math.max(0,subtotal-desconto)
  const troco=Math.max(0,onlyNumber(valorRecebido)-total)
  const cliente=clientes.find(c=>c.id===clienteId)
  function addProduto(p:any, qtd=1){
    setMsg('')
    if(Number(p.estoque||0)<=0){alert('Produto sem estoque.'); return}
    setCart(prev=>{const idx=prev.findIndex(i=>i.produto_id===p.id); if(idx>=0){return prev.map((i,k)=>k===idx?{...i,quantidade:Math.min(Number(p.estoque||0),Number(i.quantidade)+qtd)}:i)} return [...prev,{produto_id:p.id,nome:p.nome,codigo_barras:p.codigo_barras,quantidade:qtd,preco_unitario:Number(p.preco_venda||0),preco_custo_unitario:Number(p.preco_custo||0),desconto:0,estoque:Number(p.estoque||0)}]})
  }
  function atualizarQtd(id:string, qtd:number){setCart(prev=>prev.map(i=>i.produto_id===id?{...i,quantidade:Math.max(0.001,Math.min(i.estoque,qtd))}:i))}
  function descontoItem(id:string, valor:string){setCart(prev=>prev.map(i=>i.produto_id===id?{...i,desconto:onlyNumber(valor)}:i))}
  function remover(id:string){setCart(prev=>prev.filter(i=>i.produto_id!==id))}
  function limpar(){if(confirm('Limpar carrinho?')){setCart([]);setDescontoVenda('0');setValorRecebido('0');setMsg('')}}
  function buscarCodigo(code:string){setCodigo(code);setScanner(false);const p=produtos.find(x=>String(x.codigo_barras||'')===String(code)); if(p){addProduto(p); setBusca('')} else alert('Produto não encontrado para o código: '+code)}
  function enterCodigo(e:any){if(e.key==='Enter'&&codigo.trim()) buscarCodigo(codigo.trim())}
  async function finalizar(){
    if(cart.length===0)return alert('Adicione produtos ao carrinho.')
    if(forma==='fiado'&&!clienteId)return alert('Escolha o cliente para venda fiado.')
    if(forma==='dinheiro'&&onlyNumber(valorRecebido)<total)return alert('Valor recebido menor que o total.')
    setLoading(true); setMsg('')
    const {data,error}=await supabase.rpc('finalizar_venda',{p_cliente_id:clienteId||null,p_cliente_nome:cliente?.nome||null,p_forma_pagamento:forma,p_subtotal:subtotal,p_desconto:desconto,p_total:total,p_valor_recebido:onlyNumber(valorRecebido),p_troco:troco,p_itens:cart.map(i=>({produto_id:i.produto_id,nome:i.nome,quantidade:i.quantidade,preco_unitario:i.preco_unitario,preco_custo_unitario:i.preco_custo_unitario,desconto:i.desconto,subtotal:(i.quantidade*i.preco_unitario)-i.desconto}))})
    setLoading(false)
    if(error){setMsg(error.message);return}
    setMsg(`Venda finalizada: ${brl(total)}${forma==='dinheiro'?` • Troco ${brl(troco)}`:''}`)
    setCart([]); setDescontoVenda('0'); setValorRecebido('0'); setClienteId(''); setCodigo(''); setBusca(''); load()
  }
  return <main className="page"><div className="row"><div><h1 className="title">PDV</h1><p className="subtitle">Venda rápida por código ou nome.</p></div><button className="btn2" onClick={()=>setScanner(!scanner)}>{scanner?<X size={18}/>:<ScanLine size={18}/>} Câmera</button></div>
    {scanner&&<div className="card mt-4"><Scanner onDetected={buscarCodigo}/></div>}
    <div className="card mt-4 space-y-2"><div className="row"><h2 className="section-title">Buscar produto</h2><span className="pill"><Search size={14}/> {produtos.length}</span></div><input className="input" placeholder="Digite nome, parte do nome ou código" value={busca} onChange={e=>setBusca(e.target.value)}/><input className="input" placeholder="Código de barras manual" value={codigo} onChange={e=>setCodigo(e.target.value)} onKeyDown={enterCodigo}/><button className="btn2 w-full" onClick={()=>codigo.trim()&&buscarCodigo(codigo.trim())}>Adicionar pelo código</button></div>
    <div className="card mt-3"><h2 className="section-title mb-2">Venda rápida</h2><div className="grid2">{filtrados.map(p=><button key={p.id} className="btn2" onClick={()=>addProduto(p)}><span style={{textAlign:'left'}}><b>{p.nome}</b><br/><small>{brl(p.preco_venda)} • Est. {Number(p.estoque||0).toLocaleString('pt-BR')}</small></span></button>)}</div>{filtrados.length===0&&<div className="list-empty">Nenhum produto encontrado.</div>}</div>
    <div className="card mt-4"><div className="row"><h2 className="section-title"><ShoppingCart size={20} className="inline"/> Carrinho</h2><button className="btn-danger" onClick={limpar}><Trash2 size={16}/> Limpar</button></div><div className="space-y-2 mt-3">{cart.map(i=><div className="cart-item" key={i.produto_id}><div className="row"><div><b>{i.nome}</b><p className="subtitle">{brl(i.preco_unitario)} • Estoque {i.estoque.toLocaleString('pt-BR')}</p></div><button className="btn-danger" onClick={()=>remover(i.produto_id)}><Trash2 size={16}/></button></div><div className="grid2 mt-3"><div className="qty-box"><button onClick={()=>atualizarQtd(i.produto_id,i.quantidade-1)}><Minus size={15}/></button><input className="input" type="number" step="0.001" value={i.quantidade} onChange={e=>atualizarQtd(i.produto_id,onlyNumber(e.target.value))}/><button onClick={()=>atualizarQtd(i.produto_id,i.quantidade+1)}><Plus size={15}/></button></div><input className="input" type="number" step="0.01" placeholder="Desc. item" value={i.desconto} onChange={e=>descontoItem(i.produto_id,e.target.value)}/></div><p className="mt-2"><b>Subtotal:</b> {brl((i.quantidade*i.preco_unitario)-i.desconto)}</p></div>)}{cart.length===0&&<div className="list-empty">Carrinho vazio. Busque um produto acima para começar.</div>}</div></div>
    <div id="finalizar-venda" className="card checkout-total mt-4 space-y-3"><div className="row"><span>Subtotal</span><b>{brl(subtotal)}</b></div><div className="grid2"><input className="input" type="number" step="0.01" placeholder="Desconto venda" value={descontoVenda} onChange={e=>setDescontoVenda(e.target.value)}/><select className="select" value={forma} onChange={e=>setForma(e.target.value)}>{formas.map(f=><option key={f[0]} value={f[0]}>{f[1]}</option>)}</select></div>{forma==='fiado'&&<select className="select" value={clienteId} onChange={e=>setClienteId(e.target.value)}><option value="">Escolha o cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select>}{forma==='dinheiro'&&<div className="grid2"><input className="input" type="number" step="0.01" placeholder="Valor recebido" value={valorRecebido} onChange={e=>setValorRecebido(e.target.value)}/><div className="card-soft"><small>Troco</small><b className="block">{brl(troco)}</b></div></div>}<div className="row"><span>Total</span><div className="big-money">{brl(total)}</div></div><button disabled={loading||cart.length===0} className="btn w-full" onClick={finalizar}>{loading?'Finalizando...':'Finalizar venda'}</button>{msg&&<p className={msg.includes('finalizada')?'pill':'alert'}>{msg}</p>}</div>
    <Nav/></main>
}
