'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,Gamepad2,Trophy,Users,UserRound,Settings} from 'lucide-react';
const items=[[Home,'Início','/dashboard'],[Gamepad2,'Jogos','/jogos'],[Trophy,'Tabela','/classificacao'],[Users,'Jogadores','/jogadores'],[UserRound,'Perfil','/perfil']] as const;
export function BottomNav({role}:{role:string}){const pathname=usePathname();const links=role==='ADMIN'?[...items,[Settings,'Admin','/admin'] as const]:items;return <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl justify-around border-t border-white/10 bg-[#0b1115]/95 px-1 pb-[max(10px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">{links.map(([Icon,label,href])=>{const active=pathname===href||pathname.startsWith(href+'/');return <Link key={href} href={href} className={`flex min-w-12 flex-col items-center gap-1 text-[10px] font-bold ${active?'text-pitch':'text-muted'}`}><Icon size={20}/>{label}</Link>})}</nav>}
