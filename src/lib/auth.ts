import bcrypt from 'bcryptjs';
import {SignJWT,jwtVerify} from 'jose';
const secret=()=>new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');
export const hashPassword=(password:string)=>bcrypt.hash(password,12);
export const verifyPassword=(password:string,hash:string)=>bcrypt.compare(password,hash);
export async function createSession(payload:{id:string;role:string}){return new SignJWT(payload).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret())}
export async function readSession(token:string){try{return (await jwtVerify(token,secret())).payload}catch{return null}}
