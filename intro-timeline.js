const clamp = value => Math.max(0, Math.min(1, value));
const ramp = (time, from, to) => { const x=clamp((time-from)/(to-from));return x*x*(3-2*x); };
export function introState(seconds, reduced=false) {
  const time=reduced?4:Math.max(0,Math.min(4,seconds));
  const hits=[2.35,2.62];
  return {
    time,
    portal:ramp(time,.55,1.05),
    arrival:ramp(time,.78,1.45),
    landing:Math.sin(clamp((time-1.4)/.3)*Math.PI),
    protect:ramp(time,1.55,1.95)*(1-ramp(time,2.75,3.15)),
    relief:ramp(time,2.8,3.35),
    wave:ramp(time,3.35,3.65),
    ghosts:hits.map((hit,i)=>({
      approach:ramp(time,.1+i*.12,.8+i*.12),
      hit:time>=hit,
      recoil:ramp(time,hit,hit+.12),
      dissolve:ramp(time,hit+.10,hit+.35),
      pulse:clamp((time-(hit-.3))/.3),
      pulseVisible:time>=hit-.3&&time<hit,
      burstVisible:time>=hit&&time<hit+.6,
      burst:clamp((time-hit)/.6)
    }))
  };
}
