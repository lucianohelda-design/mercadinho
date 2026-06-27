'use client'
import Nav from '@/components/Nav'
import Scanner from '@/components/Scanner'
import { supabase } from '@/lib/supabase'
import { brl, onlyNumber } from '@/lib/format'
import { requireUser } from '@/lib/auth'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Minus, Plus, ScanLine, Trash2, Search, ShoppingCart, X } from 'lucide-react'

type Produto = {
  id: string
  nome: string
  codigo_barras?: string | null
  preco_venda?: number | string | null
  preco_custo?: number | string | null
  estoque?: number | string | null
  ativo?: boolean | null
}

type CartItem = {
  produto_id: string
  nome: string
  codigo_barras?: string | null
  quantidade: number
  preco_unitario: number
  preco_custo_unitario: number
  desconto: number
  estoque: number
}

const formas = [['dinheiro','Dinheiro'],['pix','Pix'],['cartao_debito','Débito'],['cartao_credito','Crédito'],['fiado','Fiado']]
const round2 = (n: number) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100
const round3 = (n: number) => Math.round((Number(n || 0) + Number.EPSILON) * 1000) / 1000
const itemSubtotal = (i: CartItem) => round2(Math.max(0, (Number(i.quantidade || 0) * Number(i.preco_unitario || 0)) - Number(i.desconto || 0)))
const normalizeCode = (v: any) => String(v ?? '').trim().replace(/\s+/g, '')
const getErr = (e: any) => e?.message || e?.details || e?.hint || String(e || 'Erro desconhecido')

function withTimeout<T>(promise: PromiseLike<T>, ms = 25000, label = 'Operação') {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} demorou demais. Confira sua internet e veja se a venda apareceu nos relatórios antes de tentar novamente.`)), ms))
  ])
}

export default function PDV(){
  const [produtos,setProdutos] = useState<Produto[]>([])
  const [clientes,setClientes] = useState<any[]>([])
  const [busca,setBusca] = useState('')
  const [codigo,setCodigo] = useState('')
  const [cart,setCart] = useState<CartItem[]>([])
  const [scanner,setScanner] = useState(false)
  const [forma,setForma] = useState('dinheiro')
  const [clienteId,setClienteId] = useState('')
  const [descontoVenda,setDescontoVenda] = useState('0')
  const [valorRecebido,setValorRecebido] = useState('0')
  const [loading,setLoading] = useState(false)
  const [msg,setMsg] = useState('')

  async function load(){
    await requireUser()
    const [p,c] = await Promise.all([
      supabase.from('produtos').select('*').eq('ativo',true).order('nome'),
      supabase.from('clientes').select('*').eq('ativo',true).order('nome')
    ])
    if (p.error) setMsg(p.error.message)
    setProdutos(p.data || [])
    setClientes(c.data || [])
  }

  useEffect(()=>{load()},[])

  const filtrados = useMemo(()=>{
    const t = busca.trim().toLowerCase()
    const base = produtos.filter(p => p.ativo !== false)
    if(!t) return base.slice(0,20)
    return base.filter(p=>`${p.nome} ${p.codigo_barras || ''}`.toLowerCase().includes(t)).slice(0,30)
  },[produtos,busca])

  const subtotal = useMemo(()=>round2(cart.reduce((a,i)=>a + itemSubtotal(i),0)),[cart])
  const desconto = round2(Math.min(subtotal, Math.max(0, onlyNumber(descontoVenda))))
  const total = round2(Math.max(0, subtotal - desconto))
  const troco = round2(Math.max(0, onlyNumber(valorRecebido) - total))
  const cliente = clientes.find(c=>c.id===clienteId)

  function addProduto(p: Produto, qtd = 1){
    setMsg('')
    const estoque = Number(p.estoque || 0)
    const precoVenda = round2(Number(p.preco_venda || 0))
    const precoCusto = round2(Number(p.preco_custo || 0))
    if(estoque <= 0){alert('Produto sem estoque.'); return}
    if(precoVenda <= 0 && !confirm('Este produto está com preço de venda zerado. Deseja adicionar mesmo assim?')) return

    setCart(prev => {
      const idx = prev.findIndex(i=>i.produto_id===p.id)
      if(idx >= 0){
        return prev.map((i,k)=>k===idx ? {...i, quantidade: Math.min(estoque, round2(Number(i.quantidade || 0) + qtd))} : i)
      }
      return [...prev, {
        produto_id: p.id,
        nome: p.nome,
        codigo_barras: p.codigo_barras,
        quantidade: qtd,
        preco_unitario: precoVenda,
        preco_custo_unitario: precoCusto,
        desconto: 0,
        estoque
      }]
    })
  }

  function atualizarQtd(id:string, qtd:number){
    setCart(prev=>prev.map(i=>i.produto_id===id ? {...i, quantidade: Math.max(0.001, Math.min(i.estoque, Number(qtd || 0)))} : i))
  }

  function descontoItem(id:string, valor:string){
    setCart(prev=>prev.map(i=>{
      if(i.produto_id!==id) return i
      const bruto = Number(i.quantidade || 0) * Number(i.preco_unitario || 0)
      return {...i, desconto: round2(Math.min(bruto, Math.max(0, onlyNumber(valor))))}
    }))
  }

  function remover(id:string){setCart(prev=>prev.filter(i=>i.produto_id!==id))}
  function limpar(){if(confirm('Limpar carrinho?')){setCart([]);setDescontoVenda('0');setValorRecebido('0');setMsg('')}}

  const buscarCodigo = useCallback((code:string)=>{
    const normalized = normalizeCode(code)
    if(!normalized) return
    setCodigo(normalized)
    setScanner(false)
    const p = produtos.find(x=>normalizeCode(x.codigo_barras) === normalized)
    if(p){
      addProduto(p)
      setBusca('')
      setMsg(`Produto adicionado pelo código: ${p.nome}`)
    } else {
      alert('Produto não encontrado para o código: ' + normalized)
    }
  },[produtos])

  function enterCodigo(e:any){if(e.key==='Enter' && codigo.trim()) buscarCodigo(codigo)}

  async function finalizarDireto() {
    const ids = [...new Set(cart.map(i => i.produto_id).filter(Boolean))]
    const produtosResp = await withTimeout(
      supabase.from('produtos').select('id,nome,codigo_barras,preco_venda,preco_custo,estoque,ativo').in('id', ids),
      25000,
      'Consulta dos produtos'
    ) as any
    if (produtosResp.error) throw new Error(getErr(produtosResp.error))

    const atuais = new Map((produtosResp.data || []).map((p: any) => [p.id, p]))
    let subtotalCalc = 0
    let lucroCalc = 0
    const estoqueDepois: {id: string, estoque: number}[] = []

    const itens = cart.map(i => {
      const atual: any = atuais.get(i.produto_id)
      if (!atual) throw new Error(`Produto não encontrado: ${i.nome}`)
      if (atual.ativo === false) throw new Error(`Produto inativo: ${atual.nome || i.nome}`)
      const estoqueAtual = Number(atual.estoque || 0)
      const quantidade = Number(i.quantidade || 0)
      if (quantidade <= 0) throw new Error(`Quantidade inválida: ${i.nome}`)
      if (estoqueAtual < quantidade) throw new Error(`Estoque insuficiente para ${atual.nome || i.nome}. Estoque atual: ${estoqueAtual}`)

      const precoVenda = round2(Number(i.preco_unitario || atual.preco_venda || 0))
      const precoCusto = round2(Number(i.preco_custo_unitario || atual.preco_custo || 0))
      const descontoItem = round2(Math.min(quantidade * precoVenda, Math.max(0, Number(i.desconto || 0))))
      const subtotalItem = round2(Math.max(0, (quantidade * precoVenda) - descontoItem))
      const lucroItem = round2(subtotalItem - (quantidade * precoCusto))
      subtotalCalc = round2(subtotalCalc + subtotalItem)
      lucroCalc = round2(lucroCalc + lucroItem)
      estoqueDepois.push({id: i.produto_id, estoque: round3(estoqueAtual - quantidade)})
      return {
        produto_id: i.produto_id,
        quantidade,
        preco_unitario: precoVenda,
        preco_custo_unitario: precoCusto,
        desconto: descontoItem,
        subtotal: subtotalItem,
        lucro: lucroItem
      }
    })

    const descontoCalc = round2(Math.min(subtotalCalc, Math.max(0, desconto)))
    const totalCalc = round2(Math.max(0, subtotalCalc - descontoCalc))
    if (forma === 'dinheiro' && onlyNumber(valorRecebido) < totalCalc) throw new Error('Valor recebido menor que o total da venda')
    const trocoCalc = round2(Math.max(0, onlyNumber(valorRecebido) - totalCalc))

    const vendaResp = await withTimeout(
      supabase.from('vendas').insert({
        cliente_id: clienteId || null,
        cliente_nome: cliente?.nome || null,
        forma_pagamento: forma,
        subtotal: subtotalCalc,
        desconto: descontoCalc,
        total: totalCalc,
        valor_recebido: onlyNumber(valorRecebido),
        troco: trocoCalc,
        lucro_estimado: lucroCalc,
        status: 'finalizada'
      }).select('id,total,troco,lucro_estimado').single(),
      25000,
      'Gravação da venda'
    ) as any
    if (vendaResp.error) throw new Error(getErr(vendaResp.error))
    const vendaId = vendaResp.data?.id
    if (!vendaId) throw new Error('Venda não retornou ID no banco de dados')

    const itensResp = await withTimeout(
      supabase.from('itens_venda').insert(itens.map(i => ({...i, venda_id: vendaId}))),
      25000,
      'Gravação dos itens da venda'
    ) as any
    if (itensResp.error) throw new Error(getErr(itensResp.error))

    for (const e of estoqueDepois) {
      const upResp = await withTimeout(
        supabase.from('produtos').update({estoque: e.estoque}).eq('id', e.id),
        25000,
        'Baixa no estoque'
      ) as any
      if (upResp.error) throw new Error(getErr(upResp.error))
    }

    if (forma === 'fiado') {
      const fiadoResp = await withTimeout(
        supabase.from('fiados').insert({
          cliente_id: clienteId || null,
          cliente_nome: cliente?.nome || 'Cliente',
          valor: totalCalc,
          valor_original: totalCalc,
          valor_aberto: totalCalc,
          status: 'aberto',
          venda_id: vendaId,
          descricao: 'Venda fiado'
        }),
        25000,
        'Registro do fiado'
      ) as any
      if (fiadoResp.error) throw new Error(getErr(fiadoResp.error))

      const receberResp = await withTimeout(
        supabase.from('contas_receber').insert({
          descricao: `Fiado - ${cliente?.nome || 'cliente'}`,
          valor: totalCalc,
          status: 'aberta',
          venda_id: vendaId,
          cliente_id: clienteId || null
        }),
        25000,
        'Conta a receber'
      ) as any
      if (receberResp.error) throw new Error(getErr(receberResp.error))
    } else {
      const caixaResp = await withTimeout(
        supabase.from('caixas').select('id').eq('status', 'aberto').order('aberto_em', {ascending:false}).limit(1).maybeSingle(),
        15000,
        'Consulta do caixa'
      ) as any
      if (!caixaResp.error && caixaResp.data?.id) {
        const movResp = await withTimeout(
          supabase.from('movimentos_caixa').insert({
            caixa_id: caixaResp.data.id,
            tipo: 'venda',
            valor: totalCalc,
            descricao: `Venda ${forma}`,
            venda_id: vendaId
          }),
          15000,
          'Movimento de caixa'
        ) as any
        if (movResp.error) throw new Error(getErr(movResp.error))
      }
    }

    return {venda_id: vendaId, total: totalCalc, troco: trocoCalc, lucro_estimado: lucroCalc}
  }

  async function finalizar(){
    if(cart.length===0) return alert('Adicione produtos ao carrinho.')
    if(forma==='fiado' && !clienteId) return alert('Escolha o cliente para venda fiado.')
    if(forma==='dinheiro' && onlyNumber(valorRecebido)<total) return alert('Valor recebido menor que o total.')
    if(total<=0 && !confirm('O total da venda está zerado. Deseja finalizar mesmo assim?')) return

    setLoading(true)
    setMsg('Finalizando venda...')
    try {
      const resultado = await finalizarDireto()
      const totalServidor = round2(Number((resultado as any)?.total ?? total))
      const trocoServidor = round2(Number((resultado as any)?.troco ?? troco))
      setMsg(`Venda finalizada: ${brl(totalServidor)}${forma==='dinheiro'?` • Troco ${brl(trocoServidor)}`:''}`)
      setCart([])
      setDescontoVenda('0')
      setValorRecebido('0')
      setClienteId('')
      setCodigo('')
      setBusca('')
      await load()
    } catch (e: any) {
      setMsg(`Não foi possível finalizar: ${getErr(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return <main className="page"><div className="row"><div><h1 className="title">PDV</h1><p className="subtitle">Venda rápida por código ou nome.</p></div><button className="btn2" onClick={()=>setScanner(!scanner)}>{scanner?<X size={18}/>:<ScanLine size={18}/>} Câmera</button></div>
    {scanner&&<div className="card mt-4"><Scanner onDetected={buscarCodigo}/></div>}
    <div className="card mt-4 space-y-2"><div className="row"><h2 className="section-title">Buscar produto</h2><span className="pill"><Search size={14}/> {produtos.length}</span></div><input className="input" placeholder="Digite nome, parte do nome ou código" value={busca} onChange={e=>setBusca(e.target.value)}/><input className="input" placeholder="Código de barras manual" value={codigo} onChange={e=>setCodigo(e.target.value)} onKeyDown={enterCodigo}/><button className="btn2 w-full" onClick={()=>codigo.trim()&&buscarCodigo(codigo)}>Adicionar pelo código</button></div>
    <div className="card mt-3"><h2 className="section-title mb-2">Venda rápida</h2><div className="grid2">{filtrados.map(p=><button key={p.id} className="btn2" onClick={()=>addProduto(p)}><span style={{textAlign:'left'}}><b>{p.nome}</b><br/><small>{brl(p.preco_venda)} • Est. {Number(p.estoque||0).toLocaleString('pt-BR')}</small></span></button>)}</div>{filtrados.length===0&&<div className="list-empty">Nenhum produto encontrado.</div>}</div>
    <div className="card mt-4"><div className="row"><h2 className="section-title"><ShoppingCart size={20} className="inline"/> Carrinho</h2><button className="btn-danger" onClick={limpar}><Trash2 size={16}/> Limpar</button></div><div className="space-y-2 mt-3">{cart.map(i=><div className="cart-item" key={i.produto_id}><div className="row"><div><b>{i.nome}</b><p className="subtitle">{brl(i.preco_unitario)} • Estoque {i.estoque.toLocaleString('pt-BR')}</p></div><button className="btn-danger" onClick={()=>remover(i.produto_id)}><Trash2 size={16}/></button></div><div className="grid2 mt-3"><div className="qty-box"><button onClick={()=>atualizarQtd(i.produto_id,i.quantidade-1)}><Minus size={15}/></button><input className="input" type="number" step="0.001" value={i.quantidade} onChange={e=>atualizarQtd(i.produto_id,onlyNumber(e.target.value))}/><button onClick={()=>atualizarQtd(i.produto_id,i.quantidade+1)}><Plus size={15}/></button></div><input className="input" type="number" step="0.01" placeholder="Desc. item" value={i.desconto} onChange={e=>descontoItem(i.produto_id,e.target.value)}/></div><p className="mt-2"><b>Subtotal:</b> {brl(itemSubtotal(i))}</p></div>)}{cart.length===0&&<div className="list-empty">Carrinho vazio. Busque um produto acima para começar.</div>}</div></div>
    <div id="finalizar-venda" className="card checkout-total mt-4 space-y-3"><div className="row"><span>Subtotal dos produtos</span><b>{brl(subtotal)}</b></div><div className="grid2"><input className="input" type="number" step="0.01" placeholder="Desconto venda" value={descontoVenda} onChange={e=>setDescontoVenda(e.target.value)}/><select className="select" value={forma} onChange={e=>setForma(e.target.value)}>{formas.map(f=><option key={f[0]} value={f[0]}>{f[1]}</option>)}</select></div>{forma==='fiado'&&<select className="select" value={clienteId} onChange={e=>setClienteId(e.target.value)}><option value="">Escolha o cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select>}{forma==='dinheiro'&&<div className="grid2"><input className="input" type="number" step="0.01" placeholder="Valor recebido" value={valorRecebido} onChange={e=>setValorRecebido(e.target.value)}/><div className="card-soft"><small>Troco</small><b className="block">{brl(troco)}</b></div></div>}<div className="row"><span>Total da venda</span><div className="big-money">{brl(total)}</div></div><button disabled={loading||cart.length===0} className="btn w-full" onClick={finalizar}>{loading?'Finalizando...':'Finalizar venda'}</button>{msg&&<p className={msg.includes('finalizada')||msg.includes('adicionado')?'pill':'alert'}>{msg}</p>}</div>
    <Nav/></main>
}
