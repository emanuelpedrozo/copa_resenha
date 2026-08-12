import {ChampionshipStatus,CompetitionFormat,MatchFormat,MatchStatus,Phase,PrismaClient,Role} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {roundRobin} from '../src/lib/tournament';
const db=new PrismaClient();
async function main(){
  const passwordHash=await bcrypt.hash(process.env.SEED_PASSWORD||'Resenha@2026',12);
  const admin=await db.user.upsert({where:{email:'admin@coparesenha.local'},update:{role:Role.ADMIN},create:{name:'Administrador',nickname:'Admin',username:'admin',email:'admin@coparesenha.local',passwordHash,role:Role.ADMIN}});
  const people=['Emanuel','João','Pedro','Carlos','Lucas','Rafael','Bruno','André'];
  const users=[];
  for(const name of people){const username=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();users.push(await db.user.upsert({where:{username},update:{},create:{name,nickname:name,username,email:`${username}@coparesenha.local`,passwordHash}}))}
  const existing=await db.championship.findFirst({where:{name:'Copa Resenha 2026'}});
  if(existing){console.log(`Seed preservado. Campeonato existente: ${existing.id}`);return}
  const championship=await db.championship.create({data:{name:'Copa Resenha 2026',description:'O campeonato mais importante que ninguém leva a sério.',competitionFormat:CompetitionFormat.LEAGUE,matchFormat:MatchFormat.HOME_AWAY,requireEvidence:false,status:ChampionshipStatus.ACTIVE,startDate:new Date(),participants:{create:users.map((u,i)=>({userId:u.id,seed:i+1}))}}});
  const fixtures=roundRobin(users.map(u=>u.id),true);
  for(const n of Array.from(new Set(fixtures.map(f=>f.round)))){const round=await db.round.create({data:{championshipId:championship.id,roundNumber:n,name:`Rodada ${n}`,phase:Phase.LEAGUE}});for(const [i,f] of fixtures.filter(x=>x.round===n).entries()){const confirmed=n<=3||n===4&&i<3;await db.match.create({data:{championshipId:championship.id,roundId:round.id,homePlayerId:f.home,awayPlayerId:f.away,status:confirmed?MatchStatus.CONFIRMED:MatchStatus.PENDING,homeScore:confirmed?(n+i)%5:null,awayScore:confirmed?(i+1)%4:null,confirmedAt:confirmed?new Date():null,submittedAt:confirmed?new Date():null,submittedById:confirmed?f.home:null,confirmedById:confirmed?f.away:null}})}}
  await db.notification.create({data:{userId:admin.id,message:'Copa Resenha 2026 criada. A resenha começou!'}});
  console.log(`Seed concluído. Admin: ${admin.email}`);
}
main().finally(()=>db.$disconnect());
