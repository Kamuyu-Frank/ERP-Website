import { useEffect, useRef, useState } from 'react';

/** Shared scroll position for pinned marketing showcases; never starts an autoplay timer. */
export function useScrollShowcase(count:number){
 const [selected,setSelected]=useState(0);
 const track=useRef<HTMLElement>(null);
 useEffect(()=>{
  const section=track.current;if(!section)return;
  let frame=0;
  const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const stage=section.querySelector<HTMLElement>('.feature-pinned-stage');if(!stage||!stage.offsetHeight)return;
   const header=window.innerWidth<=800?70:78;
   const distance=section.offsetHeight-stage.offsetHeight;if(distance<=0)return;
   const progress=Math.max(0,Math.min(count,(header-section.getBoundingClientRect().top)/distance*count));
   const index=Math.min(count-1,Math.floor(progress));
   setSelected(index);section.style.setProperty('--feature-progress',String(progress-index));
  });};
  window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);sync();
  return()=>{window.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);cancelAnimationFrame(frame);};
 },[count]);
 const jumpTo=(index:number)=>{
  const section=track.current,stage=section?.querySelector<HTMLElement>('.feature-pinned-stage');if(!section||!stage)return;
  const header=window.innerWidth<=800?70:78;
  window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-header+(section.offsetHeight-stage.offsetHeight)*(index+.08)/count,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 };
 return {selected,track,jumpTo};
}
