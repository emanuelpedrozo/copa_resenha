import {NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {createSession,verifyPassword} from '@/lib/auth';
const input=z.object({login:z.string().min(3),password:z.string().min(8)});
export async function POST(request:Request){
  try{const data=input.parse(await request.json());const user=await prisma.user.findFirst({where:{OR:[{email:data.login.toLowerCase()},{username:data.login}]}});if(!user||!await verifyPassword(data.password,user.passwordHash))return NextResponse.json({error:'Usuário ou senha inválidos.'},{status:401});const token=await createSession({id:user.id,role:user.role});const response=NextResponse.json({user:{id:user.id,name:user.name,role:user.role}});response.cookies.set('copa_session',token,{httpOnly:true,sameSite:'lax',secure:process.env.AUTH_COOKIE_SECURE==='true',path:'/',maxAge:604800});return response}catch{return NextResponse.json({error:'Dados de acesso inválidos.'},{status:400})}
}
