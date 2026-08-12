import {currentUser} from '@/lib/auth';
import {redirect} from 'next/navigation';
export default async function Page(){redirect(await currentUser()?'/dashboard':'/login')}
