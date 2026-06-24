import Link from 'next/link'
import { Home, Package, ShoppingCart, Users, BarChart3 } from 'lucide-react'
export default function Nav(){return <div className="nav"><Link href="/app"><Home/>Início</Link><Link href="/produtos"><Package/>Produtos</Link><Link href="/pdv"><ShoppingCart/>PDV</Link><Link href="/clientes"><Users/>Clientes</Link><Link href="/relatorios"><BarChart3/>Relatórios</Link></div>}
