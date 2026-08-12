import {ChampionshipStatus,CompetitionFormat,MatchFormat,MatchStatus,Phase,PrismaClient,Role} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {roundRobin} from '../src/lib/tournament';
const db=new PrismaClient();
async function main(){
  const passwordHash=await bcrypt.hash(process.env.SEED_PASSWORD||'Resenha@2026',12);
  const admin=await db.user.upsert({where:{email:'admin@coparesenha.local'},update:{role:Role.ADMIN},create:{name:'Administrador',nickname:'Admin',username:'admin',email:'admin@coparesenha.local',passwordHash,role:Role.ADMIN}});
  const roster=[
    ['emanuel','Emanuel Pedrozo','Emanuel','Bayern de Munique','fcbayern.com'],
    ['luiz.paulo','Luiz Paulo Felizali','Luiz Paulo','Real Madrid','realmadrid.com'],
    ['julio.cesar','Julio Cesar','Julio','Bayer Leverkusen','bayer04.de'],
    ['diogo.marcelino','Diogo Marcelino','Diogo','Inter de Milão','inter.it'],
    ['rodrigo.abreu','Rodrigo Abreu','Rodrigo Abreu','Atlético de Madrid','atleticodemadrid.com'],
    ['yuri.pereira','Yuri Pereira','Yuri','Manchester United','manutd.com'],
    ['anthony.jose','Anthony José','Anthony','Juventus','juventus.com'],
    ['felipe.gabriel','Felipe Gabriel','Felipe','Borússia Dortmund','bvb.de'],
    ['eduardo.coutinho','Eduardo Coutinho','Eduardo','Tottenham','tottenhamhotspur.com'],
    ['everton.lima','Everton Lima','Everton','Manchester City','mancity.com'],
    ['matheus.coutinho','Matheus Coutinho','Matheus','Barcelona','fcbarcelona.com'],
    ['eugenio.marques','Eugenio Marques','Eugenio','Liverpool','liverpoolfc.com'],
    ['gabriel.naka','Gabriel Naka','Gabriel','PSG','psg.fr'],
    ['carlos.alberto','Carlos Alberto','Carlos Alberto','Chelsea','chelseafc.com'],
    ['rodrigo.silva','Rodrigo Silva','Rodrigo Silva','Milan','acmilan.com'],
    ['alex.campos','Alex Campos','Alex','Arsenal','arsenal.com'],
  ];
  const users=[];
  for(const [username,name,nickname,teamName,domain] of roster){const teamCrestUrl=`https://www.google.com/s2/favicons?domain=${domain}&sz=128`;users.push(await db.user.upsert({where:{username},update:{name,nickname,teamName,teamCrestUrl},create:{name,nickname,username,email:`${username}@coparesenha.local`,passwordHash,teamName,teamCrestUrl}}))}
  const existing=await db.championship.findFirst({where:{name:'Copa Resenha 2026'}});
  if(existing){console.log(`Seed preservado. Campeonato existente: ${existing.id}`);return}
  const championship=await db.championship.create({data:{name:'Copa Resenha 2026',description:'O campeonato mais importante que ninguém leva a sério.',competitionFormat:CompetitionFormat.LEAGUE,matchFormat:MatchFormat.HOME_AWAY,requireEvidence:false,status:ChampionshipStatus.ACTIVE,startDate:new Date(),participants:{create:users.map((u,i)=>({userId:u.id,seed:i+1}))}}});
  const fixtures=roundRobin(users.map(u=>u.id),true);
  for(const n of Array.from(new Set(fixtures.map(f=>f.round)))){const round=await db.round.create({data:{championshipId:championship.id,roundNumber:n,name:`Rodada ${n}`,phase:Phase.LEAGUE}});for(const [i,f] of fixtures.filter(x=>x.round===n).entries()){const confirmed=n<=3||n===4&&i<3;await db.match.create({data:{championshipId:championship.id,roundId:round.id,homePlayerId:f.home,awayPlayerId:f.away,status:confirmed?MatchStatus.CONFIRMED:MatchStatus.PENDING,homeScore:confirmed?(n+i)%5:null,awayScore:confirmed?(i+1)%4:null,confirmedAt:confirmed?new Date():null,submittedAt:confirmed?new Date():null,submittedById:confirmed?f.home:null,confirmedById:confirmed?f.away:null}})}}
  await db.notification.create({data:{userId:admin.id,message:'Copa Resenha 2026 criada. A resenha começou!'}});
  console.log(`Seed concluído. Admin: ${admin.email}`);
}
main().finally(()=>db.$disconnect());
