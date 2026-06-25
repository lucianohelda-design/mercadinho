'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store, LockKeyhole } from 'lucide-react'

export default function Page(){
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[msg,setMsg]=useState('')
  const[loading,setLoading]=useState(false)
  async function login(e:any){
    e.preventDefault(); setLoading(true); setMsg('')
    const{error}=await supabase.auth.signInWithPassword({email,password})
    setLoading(false)
    if(error)setMsg('Login inválido. Confira e-mail e senha.')
    else location.href='/app'
  }
  return <main className="page">
    <section className="hero">
      <div className="pill" style={{background:'rgba(255,255,255,.18)',color:'white'}}><Store size={15}/> Sistema próprio</div>
      <h1 className="title mt-3">Mercadinho Oliveira</h1>
      <p className="mt-2 opacity-90">PDV, estoque, financeiro e fiado direto no celular.</p>
    </section>
    <form onSubmit={login} className="card space-y-3 mt-5">
      <div className="row"><h2 className="section-title">Entrar</h2><LockKeyhole color="#159447"/></div>
      <input className="input" type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input className="input" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button disabled={loading} className="btn w-full">{loading?'Entrando...':'Entrar no sistema'}</button>
      {msg&&<p className="alert">{msg}</p>}
      <p className="subtitle">O usuário é criado em Supabase → Authentication → Users.</p>
    </form>
  </main>
}
