// Startseiten-Illustration (flacher, geometrischer Stil). Farben kommen aus den --i-* Tokens.
export const heroSvg = `<svg class="hero-ill" viewBox="0 0 320 230" role="img" aria-label="Nachtlandschaft mit Mond und Tannen, davor ein Punktezettel mit verbundenen Farbpunkten, ein Bleistift, ein Würfel und eine Spielfigur">
          <defs>
            <clipPath id="blobclip"><path d="M40 120C30 60 90 18 160 20c75 2 140 30 136 98-4 64-60 96-136 94-76-2-110-32-120-92z"/></clipPath>
          </defs>
          <path class="hero-blob" d="M40 120C30 60 90 18 160 20c75 2 140 30 136 98-4 64-60 96-136 94-76-2-110-32-120-92z" style="fill:var(--i-blob)"/>
          <g style="fill:var(--i-star)">
            <circle cx="92" cy="58" r="2.2" opacity=".7"/><circle cx="196" cy="40" r="2" opacity=".6"/><circle cx="276" cy="100" r="2" opacity=".6"/><circle cx="120" cy="40" r="1.6" opacity=".5"/>
            <path d="M150 52l1.8-4.2 1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8z" opacity=".85"/>
            <path d="M70 92l1.4-3.2 1.4 3.2 3.2 1.4-3.2 1.4-1.4 3.2-1.4-3.2-3.2-1.4z" opacity=".7"/>
            <path d="M206 78l1.2-2.8 1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2z" opacity=".7"/>
          </g>
          <path d="M58 74l8-8 8 8 8-8 8 8" fill="none" style="stroke:var(--i-star)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>
          <circle cx="240" cy="64" r="21" style="fill:var(--i-sun)"/>
          <circle cx="233" cy="58" r="4.5" fill="#fff" opacity=".28"/><circle cx="247" cy="72" r="3" fill="#fff" opacity=".28"/><circle cx="246" cy="55" r="2" fill="#fff" opacity=".28"/>
          <g clip-path="url(#blobclip)">
            <path d="M20 168c50-40 100-34 150-14s100 6 150-18v100H20z" style="fill:var(--i-hill1)"/>
            <g style="fill:var(--i-tree)">
              <path d="M252 104l14 34h-28z"/><path d="M252 96l10 22h-20z"/><rect x="250" y="136" width="4" height="8"/>
              <path d="M276 116l10 26h-20z"/><rect x="274.5" y="140" width="3" height="6"/>
              <path d="M64 136l11 28h-22z"/><rect x="62.5" y="162" width="3" height="6"/>
            </g>
            <path d="M20 192c60-34 120-34 180-12s90 2 120-10v80H20z" style="fill:var(--i-hill2)"/>
          </g>
          <ellipse cx="164" cy="208" rx="112" ry="7" fill="#000" opacity=".12"/>
          <g transform="rotate(-6 130 140)">
            <rect x="82" y="80" width="98" height="120" rx="12" style="fill:var(--i-paper)"/>
            <path d="M82 92a12 12 0 0 1 12-12h74a12 12 0 0 1 12 12v8H82z" style="fill:var(--i-coral)"/>
            <text x="131" y="95" text-anchor="middle" font-family="Jost, sans-serif" font-weight="600" font-size="8.5" letter-spacing="2.2" fill="#fff">PUNKTE</text>
            <circle cx="108" cy="110" r="4.5" fill="#ef7a5c"/><circle cx="131" cy="110" r="4.5" fill="#3fb39b"/><circle cx="154" cy="110" r="4.5" fill="#f0b13e"/>
            <g style="stroke:var(--i-line)" stroke-width="1.5"><path d="M90 118h82M90 134h82M90 150h82M90 166h82"/><path d="M119.5 104v72M142.5 104v72"/></g>
            <g font-family="Jost, sans-serif" font-size="11" font-weight="500" text-anchor="middle" style="fill:var(--i-ink)">
              <text x="108" y="130">12</text><text x="131" y="130">8</text><text x="154" y="130">15</text>
              <text x="108" y="146">20</text><text x="131" y="146">14</text><text x="154" y="146">9</text>
              <text x="108" y="162">7</text><text x="131" y="162">22</text><text x="154" y="162">11</text>
            </g>
            <path d="M90 173.5h82M90 176.5h82" style="stroke:var(--i-ink)" stroke-width="1.3"/>
            <g font-family="Jost, sans-serif" font-size="12" font-weight="600" text-anchor="middle" style="fill:var(--i-ink)">
              <text x="108" y="192">39</text><text x="131" y="192">44</text><text x="154" y="192">35</text>
            </g>
            <ellipse cx="131" cy="188" rx="11" ry="9.5" fill="none" stroke="#ef7a5c" stroke-width="1.8" transform="rotate(-8 131 188)"/>
          </g>
          <g transform="translate(216 118) rotate(124)">
            <rect x="-70" y="-11" width="18" height="22" rx="7" style="fill:var(--i-eraser)"/>
            <rect x="-56" y="-11" width="11" height="22" style="fill:var(--i-metal)"/>
            <rect x="-45" y="-11" width="82" height="22" style="fill:var(--i-pencil)"/>
            <rect x="-45" y="-11" width="82" height="7" fill="#fff" opacity=".2"/>
            <rect x="-45" y="4" width="82" height="7" style="fill:var(--i-pencil-2)"/>
            <path d="M37-11l22 11-22 11z" style="fill:var(--i-wood)"/>
            <path d="M51-4l8 4-8 4z" style="fill:var(--i-ink)"/>
          </g>
          <g transform="rotate(-12 64 172)">
            <rect x="42" y="150" width="44" height="46" rx="10" style="fill:var(--i-die-2)"/>
            <rect x="42" y="150" width="44" height="38" rx="10" style="fill:var(--i-die)"/>
            <g style="fill:var(--i-pip)"><circle cx="53" cy="159" r="4"/><circle cx="64" cy="169" r="4"/><circle cx="75" cy="179" r="4"/></g>
          </g>
          <g>
            <ellipse cx="264" cy="198" rx="19" ry="6" style="fill:var(--i-pawn-2)"/>
            <path d="M249 197c1-14 5-24 10-30h10c5 6 9 16 10 30z" style="fill:var(--i-pawn)"/>
            <circle cx="264" cy="156" r="12" style="fill:var(--i-pawn)"/>
            <circle cx="259.5" cy="151.5" r="3.2" fill="#fff" opacity=".35"/>
          </g>
        </svg>`;
