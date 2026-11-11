// Illustrationen für Spielseiten (flach, geometrisch, eigene Zeichnungen). Siehe docs/DESIGN.md.
const st = (x: number, y: number, r: number) =>
  `M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}z`;

/** Icon „Freies Spiel“: leerer Zettel mit Bleistift */
export const FREE_ICON = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <g transform="rotate(-8 30 34)">
    <rect x="14" y="12" width="32" height="42" rx="6" fill="#ffffff"/>
    <path d="M14 18a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v3H14z" fill="#ef7a5c"/>
    <circle cx="22" cy="28" r="2.6" fill="none" stroke="#ef7a5c" stroke-width="1.6"/><circle cx="30" cy="28" r="2.6" fill="none" stroke="#3fb39b" stroke-width="1.6"/><circle cx="38" cy="28" r="2.6" fill="none" stroke="#f0b13e" stroke-width="1.6"/>
    <path d="M19 36h22M19 42h22M19 48h22" stroke="#dcd6e8" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g transform="translate(46 40) rotate(130)"><rect x="-17" y="-4.5" width="6" height="9" rx="2.5" fill="#f19aa9"/><rect x="-12" y="-4.5" width="22" height="9" fill="#f0b13e"/><path d="M10-4.5l8 4.5-8 4.5z" fill="#f6dcb0"/><path d="M15.5-1.4l2.5 1.4-2.5 1.4z" fill="#2e2b4f"/></g>
  <path d="${st(51, 12, 5)}" fill="#f0b13e"/><circle cx="10" cy="14" r="2" fill="#9a7ad6"/>
</svg>`;

/** Szene „Freies Spiel“: leere Zettel auf Indigo mit Farbpunkten */
export const FREE_SCENE = `<svg class="scene" viewBox="0 0 390 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="390" height="250" fill="#4644a6"/>
  <path d="M-20 60L110-20h70L-20 120z" fill="#4f4db5"/><path d="M250 270L410 100v70L320 270z" fill="#4f4db5"/>
  <circle cx="195" cy="270" r="175" fill="#5250b6"/><circle cx="195" cy="270" r="125" fill="#5d5bc2"/>
  <g fill="#ffffff" opacity=".85"><path d="${st(48, 46, 6)}"/><path d="${st(338, 58, 5)}"/><path d="${st(300, 22, 4)}"/></g>
  <g><circle cx="86" cy="104" r="7" fill="#ef7a5c"/><circle cx="62" cy="150" r="5" fill="#f0b13e"/><circle cx="110" cy="62" r="4" fill="#3fb39b"/>
    <circle cx="318" cy="118" r="7" fill="#3fb39b"/><circle cx="344" cy="160" r="5" fill="#e2709a"/><circle cx="276" cy="70" r="4" fill="#f0b13e"/>
    <circle cx="150" cy="30" r="3.5" fill="#5fa8d3"/><circle cx="236" cy="28" r="3.5" fill="#e2709a"/></g>
  <ellipse cx="200" cy="232" rx="96" ry="8" fill="#000" opacity=".16"/>
  <g transform="rotate(9 214 150)"><rect x="160" y="74" width="112" height="150" rx="14" fill="#efeaf8"/></g>
  <g transform="rotate(-6 190 150)">
    <rect x="134" y="70" width="114" height="156" rx="14" fill="#ffffff"/>
    <path d="M134 84a14 14 0 0 1 14-14h86a14 14 0 0 1 14 14v12H134z" fill="#ef7a5c"/>
    <g fill="#fff" opacity=".9"><circle cx="146" cy="83" r="3"/><circle cx="155" cy="83" r="3"/><circle cx="164" cy="83" r="3"/></g>
    <circle cx="160" cy="118" r="7" fill="none" stroke="#ef7a5c" stroke-width="3"/><circle cx="191" cy="118" r="7" fill="none" stroke="#3fb39b" stroke-width="3"/><circle cx="222" cy="118" r="7" fill="none" stroke="#f0b13e" stroke-width="3"/>
    <path d="M148 142h86M148 164h86M148 186h86M148 208h86" stroke="#dcd6e8" stroke-width="3" stroke-linecap="round"/>
    <path d="M175 132v86M207 132v86" stroke="#dcd6e8" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g transform="translate(276 158) rotate(128)">
    <rect x="-84" y="-12" width="20" height="24" rx="8" fill="#f19aa9"/><rect x="-66" y="-12" width="12" height="24" fill="#c9c6dc"/>
    <rect x="-54" y="-12" width="88" height="24" fill="#f0b13e"/><rect x="-54" y="-12" width="88" height="8" fill="#fff" opacity=".25"/><rect x="-54" y="4" width="88" height="8" fill="#d9952a"/>
    <path d="M34-12l24 12-24 12z" fill="#f6dcb0"/><path d="M49-4l9 4-9 4z" fill="#2e2b4f"/>
  </g>
</svg>`;
