'use client';
import {useRef} from 'react';
import {ArrowUpRight, MoveUpRight} from 'lucide-react';
export default function InteractiveStage({en}:{en:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 function move(event:React.PointerEvent<HTMLDivElement>){
  if(event.pointerType!=='mouse'||!matchMedia('(prefers-reduced-motion: no-preference) and (min-width: 801px)').matches)return;
  const box=event.currentTarget.getBoundingClientRect();
  ref.current?.style.setProperty('--rx',`${-(event.clientY-box.top-box.height/2)/box.height*8}deg`);
  ref.current?.style.setProperty('--ry',`${(event.clientX-box.left-box.width/2)/box.width*10}deg`);
 }
 function reset(){ref.current?.style.setProperty('--rx','0deg');ref.current?.style.setProperty('--ry','0deg')}
 return <div className="creative-stage interactive-stage atelier-stage" ref={ref} onPointerMove={move} onPointerLeave={reset} aria-label={en?'Creative possibilities, interactive sculpture':'Бүтээлч боломжууд — интерактив баримал'}><div className="atelier-grid"/><div className="atelier-axis">IDEAS TAKE SHAPE / 001</div><div className="atelier-scene"><div className="sculpture" aria-hidden="true"><div className="sculpture-core"/>{Array.from({length:7},(_,i)=><i key={i} style={{'--ring':i} as React.CSSProperties}/>)}</div><div className="atelier-project"><div className="project-top"><span>h/ STUDIO</span><ArrowUpRight size={18}/></div><div className="project-word">MAKE<br/><span>WAVES.</span></div><div className="project-footer"><span>BRAND & DIGITAL</span><span>2026</span></div></div><div className="atelier-caption"><span className="caption-icon"><MoveUpRight size={24}/></span><div><b>{en?'A little ambition.':'Том санааны'}</b><span>{en?'Limitless possibilities.':'эхлэл энд.'}</span></div></div><div className="atelier-sticker">DESIGN.<br/>BUILD.<br/><span>INSPIRE.</span></div></div><div className="atelier-bottom"><span>{en?'CONCEPT SHOWCASE':'КОНЦЕПЦ БҮТЭЭЛ'}</span><span>01 — 09</span></div></div>
}
