import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { FinanceCategoryOption, FinanceType } from "../types/finance";

function descendantIds(cats: FinanceCategoryOption[], id: string): Set<string> {
  const out = new Set<string>();
  const walk = (pid: string) => {
    for (const c of cats) {
      if (c.parentId === pid) { out.add(c.id); walk(c.id); }
    }
  };
  walk(id);
  return out;
}

function subtreeDepth(cats: FinanceCategoryOption[], id: string): number {
  const kids = cats.filter((c) => c.parentId === id);
  if (kids.length === 0) return 1;
  return 1 + Math.max(...kids.map((k) => subtreeDepth(cats, k.id)));
}

interface DestItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  depth: number;
  ok: boolean;
  reason: string;
}

function buildDestinations(
  cats: FinanceCategoryOption[],
  item: FinanceCategoryOption,
  targetType: FinanceType,
  mode: "all" | "self",
): DestItem[] {
  const desc = descendantIds(cats, item.id);
  const movedDepth = mode === "self" ? 1 : subtreeDepth(cats, item.id);
  const inType = cats.filter((c) => c.type === targetType);
  const byId = new Map(cats.map((c) => [c.id, c]));

  const levelOf = (c: FinanceCategoryOption): number => {
    let n = 1;
    let cur: FinanceCategoryOption | undefined = c;
    while (cur?.parentId) {
      n++;
      cur = byId.get(cur.parentId);
      if (!cur || n > 9) break;
    }
    return n;
  };

  const roots = inType.filter((c) => !c.parentId);
  const list: DestItem[] = [];

  const pushTree = (node: FinanceCategoryOption, depth: number) => {
    const lvl = levelOf(node);
    const isSelf = node.id === item.id;
    const isDesc = desc.has(node.id);
    const wouldOverflow = lvl + movedDepth > 3;
    const alreadyHere = item.parentId === node.id && targetType === item.type;
    list.push({
      id: node.id,
      name: node.name,
      icon: node.icon,
      color: node.color,
      depth,
      ok: !isSelf && !isDesc && !wouldOverflow && !alreadyHere,
      reason: isSelf
        ? "é a própria"
        : isDesc
          ? "está dentro desta"
          : alreadyHere
            ? "já está aqui"
            : wouldOverflow
              ? "nível máximo"
              : "",
    });
    inType
      .filter((c) => c.parentId === node.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((ch) => pushTree(ch, depth + 1));
  };

  roots.sort((a, b) => a.name.localeCompare(b.name)).forEach((r) => pushTree(r, 0));
  return list;
}

export interface MoveOpts {
  targetType: FinanceType;
  targetParentId: string | null;
  mode: "all" | "self";
}

interface Props {
  cats: FinanceCategoryOption[];
  item: FinanceCategoryOption;
  onClose: () => void;
  onApply: (opts: MoveOpts) => void;
}

function Tick() {
  return (
    <svg className="mv-dest-tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function MoverCategoriaSheet({ cats, item, onClose, onApply }: Props) {
  const [targetType, setTargetType] = useState<FinanceType>(item.type);
  const [mode, setMode] = useState<"all" | "self">("all");
  const [parentId, setParentId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const childCount = useMemo(() => cats.filter((c) => c.parentId === item.id).length, [cats, item]);
  const hasKids = childCount > 0;
  const dests = useMemo(() => buildDestinations(cats, item, targetType, mode), [cats, item, targetType, mode]);
  const crossTab = targetType !== item.type;

  const valid = useMemo(() => {
    if (parentId === null) return true;
    const d = dests.find((x) => x.id === parentId);
    return !!(d?.ok);
  }, [parentId, dests]);

  useEffect(() => {
    if (parentId !== null && !dests.some((d) => d.id === parentId && d.ok)) {
      setParentId(null);
    }
  }, [dests]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const destName = parentId === null
    ? `raiz de ${targetType === "RECEITA" ? "Recebimentos" : "Gastos"}`
    : (dests.find((d) => d.id === parentId)?.name ?? "");

  function commit() {
    if (crossTab) { setConfirming(true); return; }
    onApply({ targetType, targetParentId: parentId, mode: hasKids ? mode : "all" });
  }

  return createPortal(
    <div className="categories-composer-backdrop" onClick={onClose}>
      <div
        className="categories-composer-sheet mv-sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="categories-composer-head">
          <div>
            <span className="finance-kicker">Mover</span>
            <h3>{item.name}</h3>
            <p>Escolha a aba e onde ela deve ficar.</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose}>x</button>
        </div>

        <div className="mv-label">Aba</div>
        <div className="mv-seg">
          <button
            type="button"
            className={`is-rec${targetType === "RECEITA" ? " is-active" : ""}`}
            onClick={() => setTargetType("RECEITA")}
          >
            <span className="mv-dot" style={{ background: "#22c55e" }} />
            Recebimentos
          </button>
          <button
            type="button"
            className={`is-desp${targetType === "DESPESA" ? " is-active" : ""}`}
            onClick={() => setTargetType("DESPESA")}
          >
            <span className="mv-dot" style={{ background: "#ef4444" }} />
            Gastos
          </button>
        </div>

        {hasKids ? (
          <>
            <div className="mv-label">O que levar?</div>
            <div className="mv-choices">
              <button
                type="button"
                className={`mv-choice${mode === "all" ? " is-sel" : ""}`}
                onClick={() => setMode("all")}
              >
                <span className="mv-radio" />
                <span className="mv-choice-tx">
                  <strong>Levar as {childCount} subcategorias junto</strong>
                  <span>A árvore inteira de "{item.name}" se move</span>
                </span>
              </button>
              <button
                type="button"
                className={`mv-choice${mode === "self" ? " is-sel" : ""}`}
                onClick={() => setMode("self")}
              >
                <span className="mv-radio" />
                <span className="mv-choice-tx">
                  <strong>Mover só "{item.name}"</strong>
                  <span>As subcategorias sobem um nível e ficam onde estão</span>
                </span>
              </button>
            </div>
          </>
        ) : null}

        <div className="mv-label">Destino</div>
        <div className="mv-destlist">
          <button
            type="button"
            className={`mv-dest${parentId === null ? " is-sel" : ""}`}
            onClick={() => setParentId(null)}
          >
            <span className="mv-dest-ic is-root">⤴</span>
            <span className="mv-dest-tx">
              <strong>Tornar categoria principal</strong>
              <span>Fica na raiz de {targetType === "RECEITA" ? "Recebimentos" : "Gastos"}</span>
            </span>
            {parentId === null ? <Tick /> : null}
          </button>

          {dests.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`mv-dest${parentId === d.id ? " is-sel" : ""}${d.ok ? "" : " is-disabled"}`}
              disabled={!d.ok}
              onClick={() => { if (d.ok) setParentId(d.id); }}
              style={{ paddingLeft: 11 + d.depth * 16 }}
            >
              <span className="mv-dest-ic" style={{ background: (d.color ?? "#60a5fa") + "26" }}>
                {d.icon ?? "💼"}
              </span>
              <span className="mv-dest-tx">
                <strong>{d.name}</strong>
                <span>
                  {d.depth === 0 ? "categoria" : d.depth === 1 ? "subcategoria" : "sub-subcategoria"}
                  {d.ok ? "" : ` · ${d.reason}`}
                </span>
              </span>
              {parentId === d.id
                ? <Tick />
                : <span className="mv-dest-lvl">{d.depth === 0 ? "+ sub" : "↳"}</span>}
            </button>
          ))}
        </div>

        <div className="mv-foot">
          <div className="mv-summary">
            <b>{item.name}</b>
            <span className="mv-arrow">→</span>
            <b>{destName}</b>
            {crossTab ? (
              <span
                className="mv-dest-lvl"
                style={{ color: "#fca5a5", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.12)" }}
              >
                muda de aba
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className={`mv-btn${crossTab ? " is-warn" : ""}`}
            disabled={!valid}
            onClick={commit}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            {crossTab ? "Revisar e mover" : "Mover para aqui"}
          </button>
        </div>
      </div>

      {confirming ? (
        <div className="mv-confirm-backdrop" onClick={() => setConfirming(false)}>
          <div className="mv-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="mv-confirm-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3>Mudar de aba?</h3>
              <p>
                "{item.name}" vai sair de uma aba para a outra. Lançamentos já feitos com essa categoria podem aparecer no lado trocado do seu dashboard.
              </p>
            </div>
            <div className="mv-flow">
              <span className={`mv-pill ${item.type === "RECEITA" ? "is-rec" : "is-desp"}`}>
                <span className="mv-dot" style={{ background: item.type === "RECEITA" ? "#22c55e" : "#ef4444" }} />
                {item.type === "RECEITA" ? "Recebimentos" : "Gastos"}
              </span>
              <span style={{ color: "#60a5fa", fontWeight: 900 }}>→</span>
              <span className={`mv-pill ${targetType === "RECEITA" ? "is-rec" : "is-desp"}`}>
                <span className="mv-dot" style={{ background: targetType === "RECEITA" ? "#22c55e" : "#ef4444" }} />
                {targetType === "RECEITA" ? "Recebimentos" : "Gastos"}
              </span>
            </div>
            <div className="mv-confirm-acts">
              <button type="button" className="mv-btn is-ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="mv-btn is-warn"
                onClick={() => {
                  setConfirming(false);
                  onApply({ targetType, targetParentId: parentId, mode: hasKids ? mode : "all" });
                }}
              >
                Confirmar mudança
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

export { descendantIds };
