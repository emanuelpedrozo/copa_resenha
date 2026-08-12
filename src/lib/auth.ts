import bcrypt from 'bcryptjs';
import {SignJWT,jwtVerify} from 'jose';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {prisma} from './prisma';
const secret=()=>new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');
export const hashPassword=(password:string)=>bcrypt.hash(password,12);
export const verifyPassword=(password:string,hash:string)=>bcrypt.compare(password,hash);
export async function createSession(payload:{id:string;role:string}){return new SignJWT(payload).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret())}
export async function readSession(token:string){try{return (await jwtVerify(token,secret())).payload}catch{return null}}
export async function currentUser(){
  const token=cookies().get('copa_session')?.value;
  if(!token) return null;
  const session=await readSession(token);
  if(!session?.id || typeof session.id!=='string') return null;
  return prisma.user.findUnique({where:{id:session.id},select:{id:true,name:true,nickname:true,username:true,email:true,avatarUrl:true,teamName:true,teamCrestUrl:true,role:true}});
}
export async function requireUser(){const user=await currentUser();if(!user)redirect('/login');return user}
export async function requireAdmin(){const user=await requireUser();if(user.role!=='ADMIN')redirect('/dashboard');return user}
