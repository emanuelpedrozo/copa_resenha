import {currentUser} from '@/lib/auth';
import {NextResponse} from 'next/server';
export async function GET(){const user=await currentUser();return NextResponse.json({user},{status:user?200:401})}
