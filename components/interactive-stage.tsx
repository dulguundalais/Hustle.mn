'use client';
import {useRef,type ReactNode} from 'react';
import {PenTool,Code2,Clapperboard,ArrowUpRight} from 'lucide-react';
export default function InteractiveStage({children,en}:{children:ReactNode;en:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 function move(event:React.PointerEvent<HTMLDivElement>){
  if(event.pointerType!=='mouse'||!matchMedia('(prefers-reduced-motion: no-preference) and (min-width: 801px)').matches)return;
  const box=event.currentTarget.getBoundingClientRect();
  ref.current?.style.setProperty('--rx',`${-(event.clientY-box.top-box.height/2)/box.height*9}deg`);
  ref.current?.style.setProperty('--ry',`${(event.clientX-box.left-box.width/2)/box.width*12}deg`);
 }
 function reset(){ref.current?.style.setProperty('--rx','0deg');ref.current?.style.setProperty('--ry','0deg')}
 return <div className="creative-stage interactive-stage" ref={ref} onPointerMove={move} onPointerLeave={reset} aria-label={en?'Interactive creative portfolio showcase':'Интерактив бүтээлийн үзүүлэн'}><div className="stage-perspective">{children}<div className="tool-plaque plaque-design"><PenTool size={17}/><div><b>IDENTITY</b><small>{en?'Ideas with character':'Өөрийн өнгө төрх'}</small></div></div><div className="tool-plaque plaque-code"><Code2 size={17}/><span>Build something<br/><b>that matters.</b></span><ArrowUpRight size={15}/></div><div className="video-strip"><Clapperboard size={17}/><span>STORY / MOTION / IMPACT</span><div className="waveform">{Array.from({length:17},(_,i)=><i key={i} style={{height:8+(i*13%23)}}/>)}</div></div></div></div>
}
