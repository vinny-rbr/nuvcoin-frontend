import { useEffect, useState } from "react";
import type { BankAccount } from "../types/finance";
import { listBankAccounts } from "../lib/bankAccountsService";
import { brandOf, brandFace } from "./WalletCards";

type Props = {
  selectedId: string | null;
  onChange: (account: BankAccount | null) => void;
};

export default function BankAccountChips({ selectedId, onChange }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    void listBankAccounts().then(setAccounts).catch(() => undefined);
  }, []);

  if (accounts.length === 0) return null;

  return (
    <div className="finance-field">
      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em" }}>
        CONTA / BANCO
      </span>
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", padding: "4px 0",
        scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
      }}>
        {accounts.map((acc) => {
          const on = selectedId === acc.id;
          const brand = brandOf(acc.bank);
          const face = brandFace(acc.bank, acc.face);
          const Logo = brand.Logo;
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => onChange(on ? null : acc)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 12px 7px 7px", borderRadius: 999, cursor: "pointer", flexShrink: 0,
                border: on ? "1px solid rgba(96,165,250,0.55)" : "1px solid rgba(148,163,184,0.16)",
                background: on ? "rgba(59,130,246,0.16)" : "rgba(15,23,42,0.5)",
                transition: "all 0.18s ease",
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: 8, background: face,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <Logo s={11} />
              </span>
              <span style={{
                color: on ? "#bfdbfe" : "#cbd5e1", fontWeight: 800,
                fontSize: 12.5, fontFamily: "Manrope, system-ui", whiteSpace: "nowrap",
              }}>
                {acc.nick}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
