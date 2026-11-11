import type { PlayPlace } from "@/lib/play";

/** Original decorative illustration; never presented as a photograph of a venue. */
export function PlayArt({ art, className = "" }: { art: PlayPlace["art"]; className?: string }) {
  const night = art === "fireworks";
  return <svg viewBox="0 0 640 400" className={className} aria-hidden="true" focusable="false">
    <rect width="640" height="400" fill={night ? "#142a59" : art === "stay" ? "#e8f1ff" : "#d9ecff"} />
    <circle cx="490" cy="95" r="47" fill={night ? "#ffdd96" : "#ffffff"} />
    <path d="M0 230Q100 160 215 220T440 200T640 220V400H0Z" fill={night ? "#3e5675" : "#8ebcf3"} />
    <path d="M0 280Q140 235 300 280T640 250V400H0Z" fill={night ? "#243d66" : "#327fe0"} />
    <path d="M0 352Q150 290 340 347T640 325V400H0Z" fill="#f8fbff" />
    {(art === "sea" || art === "train") && <><path d="M50 294h80m200 12h80m100-28h70" stroke="#e6f4ff" strokeWidth="4" strokeLinecap="round"/><path d="M85 355v-65m-42 0q42-75 84 0Z" fill="#1554b9" stroke="#244878" strokeWidth="3"/><path d="M215 355v-45m-30 0q30-54 60 0Z" fill="#71adff" stroke="#244878" strokeWidth="3"/></>}
    {art === "train" && <><path d="M290 260 640 210" stroke="#f7fbff" strokeWidth="20"/><rect x="355" y="154" width="126" height="83" rx="24" fill="#1762e8"/><rect x="370" y="167" width="39" height="38" rx="10" fill="#e9f5ff"/><rect x="420" y="167" width="43" height="38" rx="10" fill="#e9f5ff"/><path d="M410 155v-27h20v27" fill="#214775"/></>}
    {art === "village" && <>{[0,1,2,3,4].map(i => <g key={i} transform={`translate(${70+i*100},${210-(i%3)*30})`}><rect width="85" height="95" fill={i%2 ? "#d8e9ff" : "#ffffff"}/><path d="M-8 0 42-38 93 0" fill={i%2 ? "#397ddb" : "#214f91"}/><rect x="14" y="20" width="21" height="29" fill="#9bc7f5"/><rect x="49" y="20" width="21" height="29" fill="#9bc7f5"/></g>)}</>}
    {art === "park" && <><circle cx="205" cy="175" r="105" fill="none" stroke="#ffffff" strokeWidth="7"/>{Array.from({length:8},(_,i)=>{const a=i*Math.PI/4; const x=205+105*Math.cos(a), y=175+105*Math.sin(a); return <g key={i}><path d={`M205 175L${x} ${y}`} stroke="#ffffff" strokeWidth="3"/><rect x={x-15} y={y-10} width="30" height="27" rx="8" fill={i%2 ? "#1762e8" : "#7cb7ff"}/></g>})}<path d="M160 320 205 175 250 320" fill="none" stroke="#285994" strokeWidth="10"/><path d="M420 310V180h65v130m-80-130 47-64 47 64" fill="#c1dcff"/><path d="M400 180h101l-49-64Z" fill="#256de0"/><rect x="440" y="250" width="25" height="60" rx="12" fill="#77a6e2"/></>}
    {art === "stay" && <><rect x="170" y="90" width="290" height="240" rx="10" fill="#ffffff"/><path d="M155 95h320l-35-30H190Z" fill="#25589e"/>{[0,1,2].map(r=>[0,1,2,3].map(c=><rect key={`${r}-${c}`} x={195+c*65} y={120+r*57} width="35" height="37" rx="3" fill="#9fc9fa"/>))}<rect x="280" y="278" width="70" height="52" fill="#356bb8"/></>}
    {night && <><path d="M40 300H600M120 300V225m400 75V225M120 235Q320 355 520 235" stroke="#e6b97b" strokeWidth="5" fill="none"/>{[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return <path key={i} d={`M${230+40*Math.cos(a)} ${110+40*Math.sin(a)}l${35*Math.cos(a)} ${35*Math.sin(a)}`} stroke="#ffb99b" strokeWidth="5" strokeLinecap="round"/>})}</>}
    <path d="M540 340v-56m0 22q-32-35-46-18m46 5q26-39 49-24" stroke="#215aa5" strokeWidth="8" fill="none" strokeLinecap="round"/>
  </svg>;
}
