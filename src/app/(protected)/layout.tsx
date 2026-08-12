import {requireUser} from '@/lib/auth';
import {AppHeader} from '@/components/app-header';
import {BottomNav} from '@/components/nav';
export const dynamic='force-dynamic';
export default async function ProtectedLayout({children}:{children:React.ReactNode}){const user=await requireUser();return <><AppHeader user={user}/><main className="safe-bottom mx-auto min-h-screen max-w-3xl px-4 pb-24 pt-5">{children}</main><BottomNav role={user.role}/></>}
