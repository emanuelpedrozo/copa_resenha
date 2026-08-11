import './globals.css';
import type { Metadata,Viewport } from 'next';
export const metadata:Metadata={title:'Copa Resenha',description:'Futebol virtual. Resenha real.',manifest:'/manifest.json'};
export const viewport:Viewport={themeColor:'#070b0e',width:'device-width',initialScale:1};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
