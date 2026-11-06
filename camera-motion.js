import {INTRO_DURATION,ease} from './intro-timeline.js';
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function openingShot(seconds,{mobile=false,reduced=false}={}){
 const time=reduced?INTRO_DURATION:Math.max(0,Math.min(INTRO_DURATION,seconds));
 let position,target,fov;
 if(time<1.65){
   const t=ease(time,.15,1.65);
   position=mix([0,1.2,15.5],[0,-.1,10.9],t);target=mix([0,-3.3,11.8],[0,-3.3,8],t);fov=mobile?54:44;
 }else{
   const rise=ease(time,1.65,2.75),settle=ease(time,4.75,7.7);
   position=mix([0,-.1,10.9],[.6-settle*.6,5.0,17-settle],rise);
   target=mix([0,-3.3,8],[0,1.3,-6+settle*2],rise);fov=44;
   if(mobile)position[2]+=rise*7;
 }
 return {position,target,fov,progress:time/INTRO_DURATION};
}
