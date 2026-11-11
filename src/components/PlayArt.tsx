import type { PlayPlace } from "@/lib/play";

/** Original decorative illustration; never presented as a photograph of a venue. */
export function PlayArt({ art, className = "" }: { art: PlayPlace["art"]; className?: string }) {
  const night = art === "fireworks";
  return <svg viewBox="0 0 640 400" className={className} aria-hidden="true" focusable="false">
    <rect width="640" height="400" fill={night ? "#23314d" : art === "stay" ? "#f4dfc9" : "#ccebe7"} />
    <circle cx="490" cy="95" r="47" fill={night ? "#ffdd96" : "#fff7d6"} />
    <path d="M0 230Q100 160 215 220T440 200T640 220V400H0Z" fill={night ? "#3e5675" : "#89beb1"} />
    <path d="M0 280Q140 235 300 280T640 250V400H0Z" fill={night ? "#243d66" : "#349d9e"} />
    <path d="M0 352Q150 290 340 347T640 325V400H0Z" fill="#f3e7c9" />
    {(art === "sea" || art === "train") && <><path d="M50 294h80m200 12h80m100-28h70" stroke="#d5f4eb" strokeWidth="4" strokeLinecap="round"/><path d="M85 355v-65m-42 0q42-75 84 0Z" fill="#f47d64" stroke="#614b43" strokeWidth="3"/><path d="M215 355v-45m-30 0q30-54 60 0Z" fill="#f7cf69" stroke="#614b43" strokeWidth="3"/></>}
    {art === "train" && <><path d="M290 260 640 210" stroke="#f8f0d8" strokeWidth="20"/><rect x="355" y="154" width="126" height="83" rx="24" fill="#f17e63"/><rect x="370" y="167" width="39" height="38" rx="10" fill="#d8f0e8"/><rect x="420" y="167" width="43" height="38" rx="10" fill="#d8f0e8"/><path d="M410 155v-27h20v27" fill="#384d48"/></>}
    {art === "village" && <>{[0,1,2,3,4].map(i => <g key={i} transform={`translate(${70+i*100},${210-(i%3)*30})`}><rect width="85" height="95" fill={i%2 ? "#f3e5cb" : "#fff9e9"}/><path d="M-8 0 42-38 93 0" fill={i%2 ? "#e59575" : "#5c8585"}/><rect x="14" y="20" width="21" height="29" fill="#8cb8b4"/><rect x="49" y="20" width="21" height="29" fill="#8cb8b4"/></g>)}</>}
    {art === "park" && <><circle cx="205" cy="175" r="105" fill="none" stroke="#fff8e9" strokeWidth="7"/>{Array.from({length:8},(_,i)=>{const a=i*Math.PI/4; const x=205+105*Math.cos(a), y=175+105*Math.sin(a); return <g key={i}><path d={`M205 175L${x} ${y}`} stroke="#fff8e9" strokeWidth="3"/><rect x={x-15} y={y-10} width="30" height="27" rx="8" fill={i%2 ? "#f18b71" : "#e5b859"}/></g>})}<path d="M160 320 205 175 250 320" fill="none" stroke="#4b7876" strokeWidth="10"/><path d="M420 310V180h65v130m-80-130 47-64 47 64" fill="#f5cf92"/><path d="M400 180h101l-49-64Z" fill="#e88975"/><rect x="440" y="250" width="25" height="60" rx="12" fill="#7aa39c"/></>}
    {art === "stay" && <><rect x="170" y="90" width="290" height="240" rx="10" fill="#fff8e9"/><path d="M155 95h320l-35-30H190Z" fill="#6a8378"/>{[0,1,2].map(r=>[0,1,2,3].map(c=><rect key={`${r}-${c}`} x={195+c*65} y={120+r*57} width="35" height="37" rx="3" fill="#9ac1b7"/>))}<rect x="280" y="278" width="70" height="52" fill="#688b80"/></>}
    {night && <><path d="M40 300H600M120 300V225m400 75V225M120 235Q320 355 520 235" stroke="#e6b97b" strokeWidth="5" fill="none"/>{[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return <path key={i} d={`M${230+40*Math.cos(a)} ${110+40*Math.sin(a)}l${35*Math.cos(a)} ${35*Math.sin(a)}`} stroke="#ffb99b" strokeWidth="5" strokeLinecap="round"/>})}</>}
    <path d="M540 340v-56m0 22q-32-35-46-18m46 5q26-39 49-24" stroke="#3b7067" strokeWidth="8" fill="none" strokeLinecap="round"/>
  </svg>;
}
