export type Fixture = { round:number; home:string; away:string };
export type Result = { homeId:string; awayId:string; homeScore:number; awayScore:number };
export type Standing = { id:string; played:number; wins:number; draws:number; losses:number; goalsFor:number; goalsAgainst:number; goalDifference:number; points:number };

export function roundRobin(ids:string[], homeAway=false):Fixture[] {
  const players=[...ids]; if(players.length<2) return [];
  if(players.length%2) players.push('__BYE__');
  const first=players[0], rotating=players.slice(1), rounds:Fixture[]=[];
  for(let r=0;r<players.length-1;r++){
    const row=[first,...rotating];
    for(let i=0;i<row.length/2;i++){
      let home=row[i], away=row[row.length-1-i];
      if(r%2 && i===0) [home,away]=[away,home];
      if(home!=='__BYE__'&&away!=='__BYE__') rounds.push({round:r+1,home,away});
    }
    rotating.unshift(rotating.pop()!);
  }
  if(!homeAway) return rounds;
  const count=players.length-1;
  return [...rounds,...rounds.map(m=>({round:m.round+count,home:m.away,away:m.home}))];
}

export function standings(ids:string[], results:Result[]):Standing[] {
  const map=new Map(ids.map(id=>[id,{id,played:0,wins:0,draws:0,losses:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0}]));
  for(const r of results){ const h=map.get(r.homeId),a=map.get(r.awayId); if(!h||!a) continue; h.played++;a.played++;h.goalsFor+=r.homeScore;h.goalsAgainst+=r.awayScore;a.goalsFor+=r.awayScore;a.goalsAgainst+=r.homeScore;if(r.homeScore>r.awayScore){h.wins++;a.losses++;h.points+=3}else if(r.homeScore<r.awayScore){a.wins++;h.losses++;a.points+=3}else{h.draws++;a.draws++;h.points++;a.points++}}
  for(const s of map.values()) s.goalDifference=s.goalsFor-s.goalsAgainst;
  return [...map.values()].sort((a,b)=>b.points-a.points||b.wins-a.wins||b.goalDifference-a.goalDifference||b.goalsFor-a.goalsFor||headToHead(b.id,a.id,results));
}
function headToHead(a:string,b:string,results:Result[]){let ap=0,bp=0;for(const r of results.filter(x=>x.homeId===a&&x.awayId===b||x.homeId===b&&x.awayId===a)){const as=r.homeId===a?r.homeScore:r.awayScore,bs=r.homeId===b?r.homeScore:r.awayScore;if(as>bs)ap+=3;else if(bs>as)bp+=3;else{ap++;bp++}}return ap-bp}

export function knockoutPairs(ids:string[], random=Math.random){const p=[...ids].sort(()=>random()-.5);const size=2**Math.ceil(Math.log2(Math.max(2,p.length)));const padded=[...p,...Array(size-p.length).fill(null)];return Array.from({length:size/2},(_,i)=>[padded[i],padded[size-1-i]] as [string|null,string|null]);}
