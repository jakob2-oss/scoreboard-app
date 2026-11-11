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

// ---------------------------------------------------------------- Spiele (aus dem Prototyp übernommen)
const SUIT: Record<string, string> = {
  heart: 'M0-5C0-13-12-13-12-4c0 8 12 13 12 18 0-5 12-10 12-18 0-9-12-9-12-1z',
  spade: 'M0-14C-2-6-12-2-12 5c0 6 7 8 11 3l-3 8h8l-3-8c4 5 11 3 11-3 0-7-10-11-12-19z',
  diamond: 'M0-14L10 0 0 14-10 0z',
  club: 'M0-13a6 6 0 0 1 5.5 8.4A6 6 0 1 1 2.5 6L5 14h-10l2.5-8A6 6 0 1 1-5.5-4.6 6 6 0 0 1 0-13z'
};
const suit = (k: string, x: number, y: number, s: number, rot: number, fill: string, op = 1) =>
  `<path d="${SUIT[k]}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${fill}" opacity="${op}"/>`;
const numCard = (x: number, y: number, rot: number, v: number, c: string, w = 44) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <rect x="${-w / 2}" y="${-w * .7}" width="${w}" height="${w * 1.4}" rx="${w * .16}" fill="${c}"/>
  <circle r="${w * .3}" fill="#fff" opacity=".92"/>
  <text y="${w * .11}" text-anchor="middle" font-family="Jost, sans-serif" font-weight="600" font-size="${w * .32}" fill="${c}">${String(v).replace('-', '\u2212')}</text></g>`;
const cloud = (x: number, y: number, s: number, c: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="-22" cy="4" r="16"/><circle cx="0" cy="-6" r="22"/><circle cx="24" cy="4" r="15"/><rect x="-38" y="4" width="76" height="16" rx="8"/></g>`;
const SCENE_OPEN = '<svg class="scene" viewBox="0 0 390 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';

export const GAME_ART: Record<string, { icon: string; scene: string }> = {
  wizard: {
    icon: `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="51" rx="25" ry="6.5" fill="#5a46a3"/>
      <path d="M13 51c9-4 13-21 18-42 6 13 12 31 20 42z" fill="#7a5cc9"/><path d="M17 47c9-3 21-3 30 0l2 4c-11-3-22-3-34 0z" fill="#f6d27a"/>
      <path d="${st(33, 31, 6)}" fill="#f6d27a"/><path d="${st(51, 15, 4.5)}" fill="#f6d27a"/><circle cx="13" cy="22" r="2.2" fill="#a99be8"/></svg>`,
    scene: `${SCENE_OPEN}<rect width="390" height="250" fill="#2f2563"/><circle cx="80" cy="30" r="120" fill="#382c74"/>
      <g fill="#f7eedc"><circle cx="30" cy="40" r="1.8" opacity=".7"/><circle cx="140" cy="28" r="1.5" opacity=".6"/><circle cx="210" cy="50" r="2" opacity=".7"/><circle cx="360" cy="120" r="1.6" opacity=".6"/>
        <path d="${st(180, 26, 6)}"/><path d="${st(42, 96, 4.5)}" opacity=".8"/><path d="${st(352, 34, 4)}" opacity=".8"/></g>
      <circle cx="305" cy="70" r="34" fill="#f6d27a"/><circle cx="322" cy="58" r="30" fill="#2f2563"/>
      <path d="M0 190l55-48 50 32 62-56 72 60 58-44 93 50v66H0z" fill="#45388a"/><path d="M0 214c70-26 130-28 190-10s120 10 200-6v52H0z" fill="#5a46a3"/>
      <rect x="52" y="118" width="34" height="98" fill="#241c4f"/><path d="M45 121l24-46 24 46z" fill="#7a5cc9"/><path d="M69 75v-14l12 5-12 5" fill="#f6d27a"/>
      <rect x="64" y="138" width="10" height="14" rx="5" fill="#f6d27a"/><rect x="64" y="168" width="10" height="14" rx="5" fill="#f6d27a" opacity=".6"/>
      <path d="M0 234c110-22 220-18 300-4s70 0 90-4v24H0z" fill="#241c4f"/>
      <path d="M92 98c40-60 100-60 112-20" fill="none" stroke="#f6d27a" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="0 12"/>
      <g transform="translate(206 128) rotate(-14)"><rect x="-24" y="-34" width="48" height="68" rx="8" fill="#f7eedc"/><rect x="-17" y="-27" width="34" height="54" rx="5" fill="#7a5cc9"/><path d="${st(0, 0, 13)}" fill="#f6d27a"/></g>
      <g transform="translate(258 116) rotate(12)"><rect x="-24" y="-34" width="48" height="68" rx="8" fill="#f7eedc"/><rect x="-17" y="-27" width="34" height="54" rx="5" fill="#3fb5a3"/>
        <circle cx="0" cy="-4" r="9" fill="#f7eedc"/><path d="M-11 14q11-10 22 0" fill="none" stroke="#f7eedc" stroke-width="4" stroke-linecap="round"/></g></svg>`
  },
  romme: {
    icon: `<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="translate(32 57)">
      <rect x="-13" y="-46" width="26" height="36" rx="4" fill="#e8684f" transform="rotate(-24)"/>
      <rect x="-13" y="-48" width="26" height="36" rx="4" fill="#2f6f62"/>
      <g transform="rotate(24)"><rect x="-13" y="-46" width="26" height="36" rx="4" fill="#fbf3e6"/>${suit('heart', 0, -29, .62, 0, '#e8684f')}</g></g></svg>`,
    scene: `${SCENE_OPEN}<rect width="390" height="250" fill="#e8684f"/>
      <path d="M-20 70L130-20h90L-20 140z" fill="#df5c45"/><path d="M170 250L390 110v80l-100 60z" fill="#df5c45"/>
      <circle cx="322" cy="54" r="30" fill="#f6c565"/>
      ${suit('heart', 58, 72, 2.4, -14, '#fbf3e6', .95)}${suit('spade', 340, 150, 1.7, 14, '#2f3a5c')}${suit('diamond', 128, 140, 1.25, 8, '#f6c565')}${suit('club', 236, 40, 1.35, -10, '#2f6f62')}
      <path d="M0 192q195-40 390 0v58H0z" fill="#2f6f62"/><path d="M0 192q195-40 390 0" fill="none" stroke="#3f8a7a" stroke-width="7"/>
      <ellipse cx="195" cy="203" rx="80" ry="8" fill="#000" opacity=".15"/>
      ${([['A', 'heart', '#e8684f', -30], ['K', 'spade', '#2f3a5c', -10], ['D', 'diamond', '#e8684f', 10], ['B', 'club', '#2f6f62', 30]] as [string, string, string, number][]).map(([l, k, c, a]) => `
      <g transform="translate(195 206) rotate(${a})"><rect x="-25" y="-96" width="50" height="72" rx="8" fill="#fbf3e6"/>
        <text x="-19" y="-80" font-family="Jost, sans-serif" font-weight="600" font-size="13" fill="${c}">${l}</text>${suit(k, -14, -64, .42, 0, c)}</g>`).join('')}</svg>`
  },
  skyjo: {
    icon: `<svg viewBox="0 0 64 64" aria-hidden="true">${numCard(22, 22, -6, -2, '#3b4fa8', 20)}${numCard(43, 22, 5, 12, '#e0543a', 20)}${numCard(22, 44, 4, 5, '#4fae5e', 20)}${numCard(43, 44, -5, 0, '#4aa3d8', 20)}</svg>`,
    scene: `${SCENE_OPEN}<rect width="390" height="250" fill="#78bde6"/><circle cx="322" cy="50" r="28" fill="#f8d77a"/>
      ${cloud(70, 52, 1, '#fbf6ec')}${cloud(250, 34, .7, '#fbf6ec')}
      <path d="M150 52q5-5 10 0q5-5 10 0M184 70q4-4 8 0q4-4 8 0" fill="none" stroke="#2f3a5c" stroke-width="2.4" stroke-linecap="round"/>
      ${cloud(40, 222, 2.2, '#eaf3fb')}${cloud(330, 230, 2.4, '#eaf3fb')}${cloud(200, 246, 2.6, '#f6fafd')}
      ${numCard(84, 138, -16, -2, '#3b4fa8')}${numCard(142, 112, -6, 0, '#4aa3d8')}${numCard(200, 132, 4, 5, '#4fae5e')}${numCard(258, 108, 12, 9, '#f2b93b')}${numCard(312, 140, 20, 12, '#e0543a')}</svg>`
  }
};
