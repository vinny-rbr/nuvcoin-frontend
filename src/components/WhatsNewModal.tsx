import { useEffect, useState } from "react";
import { APP_VERSION } from "../lib/appVersion";
import { CHANGELOG } from "../lib/changelog";

const PENDING_KEY = "conciliaai_pending_whats_new";

export default function WhatsNewModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(PENDING_KEY) === "1") {
      localStorage.removeItem(PENDING_KEY);
      // Only show if we actually have notes for this version
      if (CHANGELOG[APP_VERSION]?.length) {
        setVisible(true);
      }
    }
  }, []);

  if (!visible) return null;

  const entries = CHANGELOG[APP_VERSION] ?? [];

  return (
    <div className="wnm-scrim" onClick={() => setVisible(false)}>
      <div className="wnm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="wnm-handle" />

        <div className="wnm-header">
          <span className="wnm-icon">🎉</span>
          <div>
            <div className="wnm-title">O que há de novo</div>
            <div className="wnm-version">Versão {APP_VERSION}</div>
          </div>
        </div>

        <ul className="wnm-list">
          {entries.map((entry, i) => (
            <li key={i} className="wnm-item">
              <span className="wnm-emoji" aria-hidden="true">{entry.emoji}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>

        <button className="wnm-btn" onClick={() => setVisible(false)}>
          Entendido 👍
        </button>
      </div>
    </div>
  );
}
