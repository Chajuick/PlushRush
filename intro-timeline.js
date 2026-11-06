export const INTRO_DURATION=8.6;
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=(t,a,b)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x);};
export function introState(seconds,reduced=false){
  const time=reduced?INTRO_DURATION:Math.max(0,Math.min(INTRO_DURATION,seconds));
  const launches=[6.25,6.5,6.75];
  return {
    time,fade:1-ease(time,0,.55),rise:ease(time,1.65,2.75),
    storm:ease(time,3.65,4.35)*(1-ease(time,7.7,8.6)),
    thunder:Math.max(0,1-Math.abs(time-4.05)/.07)*.55+Math.max(0,1-Math.abs(time-4.42)/.09)*.3,
    distress:ease(time,3.8,4.4)*(1-ease(time,7.7,8.4)),
    nightmare:ease(time,4.1,4.5)*(1-ease(time,7.7,8.2)),
    portal:ease(time,4.7,5.1),arrival:ease(time,5.05,5.8),
    landing:Math.sin(ease(time,5.72,6.02)*Math.PI),
    cheer:ease(time,5.65,6.05),shock:ease(time,6.05,6.65),
    logo:ease(time,7.85,8.6),
    ghosts:launches.map((launch,i)=>{
      const flight=ease(time,launch,launch+.75),burst=ease(time,launch+.75,launch+1.2);
      return {spawn:ease(time,4.35+i*.16,4.85+i*.16),flight,burst,visible:time>4.35+i*.16&&time<launch+.75,burstVisible:time>=launch+.75&&time<launch+1.2};
    })
  };
}
