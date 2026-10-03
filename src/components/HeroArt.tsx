/**
 * 히어로 일러스트 — 직접 그린 단순 벡터 그래픽(외부 에셋 없음).
 * 사람들이 "더 많은 사람에게!" / "지금, 더홍보에서!" 팻말과 메가폰, 스마트폰을 들고 있는 장면입니다.
 */

interface PersonProps {
  x: number;
  y: number;
  skin: string;
  hair: string;
  style: "short" | "long" | "cap" | "bob" | "swoop";
  top: string;
  scale?: number;
  mouth?: "smile" | "grin";
}

function Person({ x, y, skin, hair, style, top, scale = 1, mouth = "grin" }: PersonProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {style === "long" && <path d="M-38 36C-44 -14 -18 -30 0 -30C20 -30 44 -14 38 36L44 120L-44 120Z" fill={hair} />}
      {style === "bob" && <path d="M-37 40C-42 -12 -18 -28 0 -28C20 -28 42 -12 37 40L38 70L-38 70Z" fill={hair} />}
      {/* 몸통 */}
      <path d="M-62 190C-62 138 -38 110 0 110C38 110 62 138 62 190L62 330L-62 330Z" fill={top} />
      <path d="M-14 110C-10 128 10 128 14 110L8 104L-8 104Z" fill={skin} />
      <path d="M-20 112Q0 138 20 112" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="3" strokeLinecap="round" />
      {/* 목 */}
      <rect x="-10" y="76" width="20" height="34" rx="8" fill={skin} />
      {/* 귀 */}
      <ellipse cx="-33" cy="44" rx="5" ry="8" fill={skin} />
      <ellipse cx="33" cy="44" rx="5" ry="8" fill={skin} />
      {/* 얼굴 */}
      <ellipse cx="0" cy="40" rx="33" ry="39" fill={skin} />
      {/* 머리카락 */}
      {style === "short" && <path d="M-35 36C-40 -8 -16 -22 2 -22C24 -22 40 -6 35 36C28 14 14 4 -4 6C-20 8 -30 18 -35 36Z" fill={hair} />}
      {style === "long" && <path d="M-35 34C-38 -10 -14 -24 2 -24C22 -24 38 -10 35 34C26 8 8 -2 -6 4C-20 10 -30 20 -35 34Z" fill={hair} />}
      {style === "bob" && <path d="M-36 32C-40 -12 -16 -26 2 -26C24 -26 40 -10 36 32C30 10 14 -2 -8 2C-22 6 -32 16 -36 32Z" fill={hair} />}
      {style === "swoop" && <path d="M-36 34C-42 -12 -14 -28 6 -26C28 -24 42 -8 36 34C30 12 18 0 2 4C-10 8 -26 4 -36 34Z" fill={hair} />}
      {style === "cap" && (
        <>
          <path d="M-36 24C-38 -18 -14 -30 2 -30C24 -30 40 -14 36 24Z" fill="#f4f1ec" />
          <path d="M-36 24C-12 28 20 26 52 34C50 24 40 20 36 20Z" fill="#e3ded6" />
          <path d="M-30 30C-40 36 -38 44 -33 52" fill="none" stroke={hair} strokeWidth="9" strokeLinecap="round" />
        </>
      )}
      {/* 눈/입 */}
      <ellipse cx="-12" cy="44" rx="3.4" ry="4.6" fill="#2a2018" />
      <ellipse cx="12" cy="44" rx="3.4" ry="4.6" fill="#2a2018" />
      <circle cx="-11" cy="42.5" r="1.1" fill="#fff" />
      <circle cx="13" cy="42.5" r="1.1" fill="#fff" />
      <path d="M-15 34Q-12 31 -8 33M8 33Q12 31 15 34" fill="none" stroke="#2a2018" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      <circle cx="-22" cy="56" r="6" fill="#ff8a8a" opacity=".35" />
      <circle cx="22" cy="56" r="6" fill="#ff8a8a" opacity=".35" />
      {mouth === "grin" ? (
        <>
          <path d="M-13 58Q0 74 13 58Z" fill="#7a2f33" />
          <path d="M-10 58.5Q0 63 10 58.5Z" fill="#fff" />
        </>
      ) : (
        <path d="M-11 60Q0 70 11 60" fill="none" stroke="#7a2f33" strokeWidth="3" strokeLinecap="round" />
      )}
    </g>
  );
}

const Hand = ({ x, y, skin = "#f6c8a4", r = 11 }: { x: number; y: number; skin?: string; r?: number }) => <circle cx={x} cy={y} r={r} fill={skin} />;

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 690 340"
      className={className}
      role="img"
      aria-label="여러 사람이 팻말과 메가폰, 스마트폰을 들고 홍보하는 일러스트"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <filter id="hs" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1b2540" floodOpacity=".22" />
        </filter>
      </defs>

      {/* 구름 */}
      <g fill="#fff" opacity=".85">
        <ellipse cx="560" cy="44" rx="42" ry="18" />
        <ellipse cx="536" cy="52" rx="28" ry="15" />
        <ellipse cx="586" cy="54" rx="26" ry="14" />
      </g>

      {/* 뒷줄 */}
      <Person x={185} y={62} skin="#f7cfae" hair="#5a3a28" style="long" top="#e9a9c0" />
      <Person x={338} y={44} skin="#f6c9a6" hair="#241a16" style="cap" top="#2c3a56" scale={1.04} />
      <Person x={456} y={66} skin="#f3c19a" hair="#17120f" style="short" top="#1f2430" />

      {/* 앞줄 */}
      <Person x={88} y={96} skin="#f6c8a4" hair="#2b2320" style="short" top="#a7b0bd" scale={1.04} />
      <Person x={548} y={52} skin="#f7cdb0" hair="#2a1d17" style="swoop" top="#f3e1b8" scale={1.04} mouth="smile" />

      {/* 팻말: 더 많은 사람에게! */}
      <g transform="translate(38 218) rotate(-6)" filter="url(#hs)">
        <rect x="0" y="0" width="150" height="98" rx="5" fill="#fff" />
        <rect x="0" y="0" width="150" height="98" rx="5" fill="none" stroke="#e5e8ee" />
        <text x="75" y="40" textAnchor="middle" fontSize="23" fontWeight="800" fill="#1b1d22">더 많은</text>
        <text x="75" y="72" textAnchor="middle" fontSize="23" fontWeight="800" fill="#1b1d22">사람에게!</text>
      </g>
      <Hand x={56} y={304} />
      <Hand x={184} y={288} />

      {/* 스마트폰: 하자! */}
      <g transform="translate(262 196) rotate(3)" filter="url(#hs)">
        <rect x="0" y="0" width="74" height="132" rx="13" fill="#1d2230" />
        <rect x="5" y="6" width="64" height="120" rx="9" fill="#fff" />
        <rect x="26" y="9" width="22" height="5" rx="2.5" fill="#1d2230" />
        <text x="37" y="62" textAnchor="middle" fontSize="20" fontWeight="800" fill="#f04f4a">하자!</text>
        <rect x="14" y="76" width="46" height="5" rx="2.5" fill="#e5e8ee" />
        <rect x="14" y="88" width="34" height="5" rx="2.5" fill="#e5e8ee" />
        <rect x="14" y="104" width="46" height="14" rx="7" fill="#f04f4a" />
      </g>
      <Hand x={272} y={290} />
      <Hand x={330} y={296} />

      {/* 브이 포즈 */}
      <g transform="translate(410 160) rotate(14)">
        <rect x="-6" y="0" width="9" height="30" rx="4.5" fill="#f3c19a" />
        <rect x="6" y="2" width="9" height="28" rx="4.5" fill="#f3c19a" transform="rotate(14 10 16)" />
        <rect x="-8" y="26" width="26" height="20" rx="9" fill="#f3c19a" />
      </g>

      {/* 팻말: 지금, 더홍보에서! */}
      <g transform="translate(366 196) rotate(-9)" filter="url(#hs)">
        <rect x="0" y="0" width="156" height="104" rx="5" fill="#fff" />
        <rect x="0" y="0" width="156" height="104" rx="5" fill="none" stroke="#e5e8ee" />
        <text x="78" y="36" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1b1d22">지금,</text>
        <text x="78" y="74" textAnchor="middle" fontSize="24" fontWeight="900" fill="#f04f4a">더홍보에서!</text>
      </g>
      <Hand x={382} y={278} />
      <Hand x={512} y={276} />

      {/* 메가폰 */}
      <g transform="translate(560 128) rotate(-14)" filter="url(#hs)">
        <path d="M0 18L58 -6V74L0 50Z" fill="#f04f4a" />
        <path d="M58 -14C66 -14 70 -6 70 34C70 74 66 82 58 82Z" fill="#c93a35" />
        <rect x="-18" y="14" width="22" height="40" rx="6" fill="#2a2f3b" />
        <rect x="10" y="52" width="14" height="22" rx="5" fill="#2a2f3b" />
        <path d="M84 20L108 10M86 36H114M84 52L108 62" stroke="#f04f4a" strokeWidth="5" strokeLinecap="round" />
      </g>
      <Hand x={572} y={208} skin="#f7cdb0" />

      {/* 장식 */}
      <path d="M470 18C466 10 454 12 454 22C454 32 470 40 470 40C470 40 486 32 486 22C486 12 474 10 470 18Z" fill="#ff7a8a" />
      <path d="M22 48l7 14 15 2-11 11 3 15-14-8-14 8 3-15L0 64l15-2z" fill="#ffd166" transform="translate(40 -4) scale(.9)" />
    </svg>
  );
}
