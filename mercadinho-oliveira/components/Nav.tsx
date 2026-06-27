'use client'
import Link from 'next/link'
import { Home, ShoppingCart, Package, Users, WalletCards, BarChart3 } from 'lucide-react'
export default function Nav(){
  return <nav className="nav">
    <Link href="/app"><Home/>Início</Link>
    <Link href="/pdv"><ShoppingCart/>PDV</Link>
    <Link href="/produtos"><Package/>Produtos</Link>
    <Link href="/clientes"><Users/>Clientes</Link>
    <Link href="/financeiro"><WalletCards/>Financeiro</Link>
    <Link href="/relatorios"><BarChart3/>Relatórios</Link>
  </nav>
}
