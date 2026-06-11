/* Ícones SVG — categorias + UI. Estilo "stroke" como o app nuvcoin. */

function NuvIcon({ name, size = 22, stroke = "currentColor", sw = 2, fill = "none", style }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill, stroke, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
    style,
  };
  switch (name) {
    // ---- categorias ----
    case "cutlery": return (
      <svg {...common}><path d="M4 3v7a2 2 0 0 0 2 2v9"/><path d="M6 3v7"/><path d="M8 3v7"/><path d="M18 3c-1.7 0-3 2-3 5s1 4 3 4v9"/></svg>
    );
    case "home": return (
      <svg {...common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>
    );
    case "bolt": return (
      <svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
    );
    case "wifi": return (
      <svg {...common}><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="0.6" fill={stroke}/></svg>
    );
    case "car": return (
      <svg {...common}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4H4z"/><circle cx="7.5" cy="17.5" r="1.2"/><circle cx="16.5" cy="17.5" r="1.2"/></svg>
    );
    case "ticket": return (
      <svg {...common}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M14 7v10"/></svg>
    );
    case "wallet": return (
      <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5"/><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H5"/><circle cx="16.5" cy="13.5" r="1.1" fill={stroke}/></svg>
    );
    case "laptop": return (
      <svg {...common}><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/></svg>
    );
    case "chart": return (
      <svg {...common}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/></svg>
    );
    // ---- UI ----
    case "search": return (
      <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
    );
    case "filter": return (
      <svg {...common}><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></svg>
    );
    case "kebab": return (
      <svg {...common} strokeWidth="0" fill={stroke}><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
    );
    case "chevron-down": return (
      <svg {...common}><path d="m6 9 6 6 6-6"/></svg>
    );
    case "chevron-left": return (
      <svg {...common}><path d="m15 6-6 6 6 6"/></svg>
    );
    case "chevron-right": return (
      <svg {...common}><path d="m9 6 6 6-6 6"/></svg>
    );
    case "lock": return (
      <svg {...common}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
    );
    case "receipt": return (
      <svg {...common}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6"/><path d="M9 12h6"/></svg>
    );
    case "plus": return (
      <svg {...common} strokeWidth="2.4"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
    );
    case "check": return (
      <svg {...common} strokeWidth="2.6"><path d="M20 6 9 17l-5-5"/></svg>
    );
    case "x": return (
      <svg {...common} strokeWidth="2.4"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
    );
    case "clock": return (
      <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    );
    case "repeat": return (
      <svg {...common}><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    );
    case "calendar": return (
      <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>
    );
    // ---- edição ----
    case "arrow-left": return (
      <svg {...common}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
    );
    case "trash": return (
      <svg {...common}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v5"/><path d="M14 11v5"/></svg>
    );
    case "heart": return (
      <svg {...common}><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/></svg>
    );
    case "mic": return (
      <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>
    );
    case "bookmark": return (
      <svg {...common}><path d="M6 3h12v18l-6-4-6 4z"/></svg>
    );
    case "folder": return (
      <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    );
    case "image": return (
      <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>
    );
    case "pencil": return (
      <svg {...common}><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/></svg>
    );
    case "tag": return (
      <svg {...common}><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>
    );
    case "upload": return (
      <svg {...common}><path d="M12 16V4"/><path d="m6 10 6-6 6 6"/><path d="M4 20h16"/></svg>
    );
    case "help": return (
      <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.8 2.3-2.8 4"/><circle cx="11.8" cy="17.2" r="0.6" fill={stroke}/></svg>
    );
    case "check-circle": return (
      <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-4.5"/></svg>
    );
    case "calendar-check": return (
      <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="m9 15 2 2 4-4"/></svg>
    );
    // nav
    case "nav-home": return (
      <svg {...common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>
    );
    case "nav-tag": return (
      <svg {...common}><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>
    );
    case "nav-groups": return (
      <svg {...common}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17.5 14.4A5.5 5.5 0 0 1 20.5 19.5"/></svg>
    );
    case "nav-plan": return (
      <svg {...common}><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
    );
    default: return null;
  }
}

Object.assign(window, { NuvIcon });
