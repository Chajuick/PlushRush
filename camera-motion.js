// One continuous cubic path: no intermediate camera stops between action beats.
function bezier(points,t){const s=1-t;return points[0]*s*s*s+3*points[1]*s*s*t+3*points[2]*s*t*t+points[3]*t*t*t;}
export function openingShot(seconds,{mobile=false,reduced=false}={}){
  const time=reduced?4:Math.max(0,Math.min(4,seconds)),t=time/4;
  const path=t*t*(3-2*t);
  const position=[bezier([-3.8,-2,4,.7],path),bezier([4.4,5,5.2,6.7],path),bezier([20.5,18,13,16],path)];
  if(mobile){position[0]*=.6;position[2]+=9;}
  return {position,target:[bezier([0,.4,.2,0],path),bezier([.5,1.6,2.2,2.8],path),bezier([1,-2,.8,-2],path)],fov:49-6*(t*t*(3-2*t)),progress:t};
}
