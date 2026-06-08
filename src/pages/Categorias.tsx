import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FinanceCategoryOption, FinanceType } from "../types/finance";
import {
  createFinanceCategory,
  deleteFinanceCategory,
  listFinanceCategories,
  moveFinanceCategory,
  updateFinanceCategory,
} from "../lib/financeCategoriesService";
import MoverCategoriaSheet, { descendantIds } from "../components/MoverCategoriaSheet";
import type { MoveOpts } from "../components/MoverCategoriaSheet";
import "./dashboard.css";
import "./finance.css";

const typeLabels: Record<FinanceType, { title: string; kicker: string; empty: string; placeholder: string }> = {
  RECEITA: {
    title: "Categorias de recebimento",
    kicker: "Entradas",
    empty: "Nenhuma categoria de recebimento cadastrada.",
    placeholder: "Ex: Consultoria",
  },
  DESPESA: {
    title: "Categorias de gastos",
    kicker: "Saidas",
    empty: "Nenhuma categoria de gasto cadastrada.",
    placeholder: "Ex: Impostos",
  },
};

const categoryEmojis = [
  "🍽️", "🚗", "👕", "🏠", "📚", "💵", "🎁", "📈", "🛡️", "•••",
  "✈️", "🏦", "🛍️", "🚲", "🦴", "📱", "💼", "🧹", "🚌", "🎂",
  "🧮", "📅", "🎥", "📷", "🍬", "🛒", "🐾", "💻", "💎", "🏀",
  "🏋️", "✉️", "🙂", "🍔", "📊", "🎮", "⛽", "🔑", "❤️", "🏥",
  "🛏️", "☁️", "💡", "🗺️", "🎤", "🎵", "🧾", "📌", "🌲", "🦷",
  "🏆", "🔒", "🌎",
];

const categoryColors = [
  "#60a5fa", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#64748b", "#f97316",
];

const LONGPRESS_MS = 200;
const MOVE_CANCEL = 12;
const CAT_ORDER_KEY = "cc-cat-order";

function MoveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l-3 3 3 3" />
      <path d="M9 5l3-3 3 3" />
      <path d="M15 19l-3 3-3-3" />
      <path d="M19 9l3 3-3 3" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
    </svg>
  );
}

interface DragInfo { type: "card" | "nova"; id?: string }
interface DragState extends DragInfo {
  w: number; h: number; ox: number; oy: number; x: number; y: number; target: number;
}
interface GestureData {
  info: DragInfo; rect: DOMRect;
  x0: number; y0: number;
  started: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

export default function Categorias() {
  const [categories, setCategories] = useState<FinanceCategoryOption[]>([]);
  const [activeType, setActiveType] = useState<FinanceType>("RECEITA");
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("💼");
  const [selectedColor, setSelectedColor] = useState("#60a5fa");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [menuEntity, setMenuEntity] = useState<FinanceCategoryOption | null>(null);
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [drillAnim, setDrillAnim] = useState<string>("");
  const [moveItem, setMoveItem] = useState<FinanceCategoryOption | null>(null);

  // Drag & drop state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>(() => {
    try { const s = localStorage.getItem(CAT_ORDER_KEY); return s ? JSON.parse(s) : {}; }
    catch { return {}; }
  });

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const dragGestRef = useRef<GestureData | null>(null);
  const openCreateRef = useRef<(parentId?: string) => void>(() => undefined);

  // ---- memos ----
  const visibleCategories = useMemo(
    () =>
      categories
        .filter((category) => category.type === activeType)
        .slice()
        .sort((a, b) => (a.fullPath ?? a.name).localeCompare(b.fullPath ?? b.name)),
    [activeType, categories],
  );

  const parentOptions = useMemo(
    () => visibleCategories.filter((category) => (category.level ?? 1) < 3 && category.id !== editingId),
    [editingId, visibleCategories],
  );

  const rootCategories = useMemo(
    () => visibleCategories.filter((category) => !category.parentId),
    [visibleCategories],
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, FinanceCategoryOption[]>();
    for (const category of visibleCategories) {
      if (!category.parentId) continue;
      const current = map.get(category.parentId) ?? [];
      current.push(category);
      map.set(category.parentId, current);
    }
    return map;
  }, [visibleCategories]);

  const categoryById = useMemo(() => {
    const map = new Map<string, FinanceCategoryOption>();
    for (const c of visibleCategories) map.set(c.id, c);
    return map;
  }, [visibleCategories]);

  // User-ordered root categories (order persisted in localStorage)
  const orderedRootCats = useMemo(() => {
    const order = localOrder[activeType] ?? [];
    if (!order.length) return rootCategories;
    return [...rootCategories].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [rootCategories, localOrder, activeType]);

  // Grid slots: inject placeholder at target during drag
  const gridSlots = useMemo(() => {
    if (!dragState) {
      return orderedRootCats.map(c => ({ kind: "card" as const, cat: c, key: c.id }));
    }
    const remaining = dragState.type === "card" && dragState.id
      ? orderedRootCats.filter(c => c.id !== dragState.id)
      : orderedRootCats;
    const slots: Array<{ kind: "ph"; key: string } | { kind: "card"; cat: FinanceCategoryOption; key: string }> = [];
    for (let i = 0; i <= remaining.length; i++) {
      if (dragState.target === i) slots.push({ kind: "ph", key: "ph" });
      if (i < remaining.length) slots.push({ kind: "card", cat: remaining[i], key: remaining[i].id });
    }
    return slots;
  }, [orderedRootCats, dragState]);

  const draggedCat = dragState?.type === "card" && dragState.id
    ? orderedRootCats.find(c => c.id === dragState.id) ?? null
    : null;

  const drillNode = drillPath.length > 0 ? (categoryById.get(drillPath[drillPath.length - 1]) ?? null) : null;
  const drillChildren = drillNode ? (childrenByParentId.get(drillNode.id) ?? []) : [];

  const drillAncestors = useMemo(() => {
    if (drillPath.length === 0) return [] as Array<{ name: string; depth: number }>;
    const result: Array<{ name: string; depth: number }> = [];
    const firstSub = categoryById.get(drillPath[0]);
    if (firstSub?.parentId) {
      const rootCat = categoryById.get(firstSub.parentId);
      if (rootCat) result.push({ name: rootCat.name, depth: 0 });
    }
    for (let i = 0; i < drillPath.length - 1; i++) {
      const node = categoryById.get(drillPath[i]);
      if (node) result.push({ name: node.name, depth: i + 1 });
    }
    return result;
  }, [drillPath, categoryById]);

  // ---- effects ----
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const loaded = await listFinanceCategories();
        if (isMounted) setCategories(loaded);
      } catch {
        if (isMounted) setFeedback("Nao foi possivel carregar as categorias agora.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setAnimate(false);
    const id = window.setTimeout(() => setAnimate(true), 40);
    return () => window.clearTimeout(id);
  }, [activeType, categories.length]);

  useEffect(() => {
    if (!composerOpen) return undefined;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, [composerOpen]);

  // Keep openCreate ref fresh
  useEffect(() => { openCreateRef.current = openCreate; });

  // Global pointer events for drag
  useEffect(() => {
    function computeTarget(x: number, y: number): number {
      const grid = gridRef.current;
      if (!grid) return orderedRootCats.length;
      const slotEls = [...grid.querySelectorAll("[data-drag-slot]")];
      for (let i = 0; i < slotEls.length; i++) {
        const r = slotEls[i].getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const before = y < r.top ? true : y <= r.bottom ? x < cx : false;
        if (before) return i;
      }
      return slotEls.length;
    }

    function clearGest() {
      if (dragGestRef.current?.timer) clearTimeout(dragGestRef.current.timer);
      dragGestRef.current = null;
    }

    function onMove(e: PointerEvent) {
      const g = dragGestRef.current;
      if (!g) return;
      const x = e.clientX, y = e.clientY;
      if (!g.started) {
        if (Math.hypot(x - g.x0, y - g.y0) > MOVE_CANCEL) clearGest();
        return;
      }
      e.preventDefault();
      setDragState(d => d ? { ...d, x, y, target: computeTarget(x, y) } : d);
    }

    function onUp(e: PointerEvent) {
      const g = dragGestRef.current;
      const wasDragging = g?.started ?? false;
      const info = g?.info;
      clearGest();

      if (!wasDragging) {
        if (info?.type === "nova") openCreateRef.current();
        setDragState(null);
        return;
      }

      const target = computeTarget(e.clientX, e.clientY);

      if (info?.type === "card" && info.id) {
        const catId = info.id;
        setLocalOrder(prev => {
          const base = [...(prev[activeType] ?? orderedRootCats.map(c => c.id))];
          let from = base.indexOf(catId);
          if (from === -1) {
            const order = orderedRootCats.map(c => c.id);
            from = order.indexOf(catId);
            if (from === -1) return prev;
            const [m] = order.splice(from, 1);
            const to = Math.max(0, Math.min(order.length, from < target ? target - 1 : target));
            order.splice(to, 0, m);
            const updated = { ...prev, [activeType]: order };
            try { localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(updated)); } catch {}
            return updated;
          }
          const [m] = base.splice(from, 1);
          const to = Math.max(0, Math.min(base.length, from < target ? target - 1 : target));
          base.splice(to, 0, m);
          const updated = { ...prev, [activeType]: base };
          try { localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(updated)); } catch {}
          return updated;
        });
      } else if (info?.type === "nova") {
        openCreateRef.current();
      }

      setDragState(null);
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, orderedRootCats]);

  // ---- helpers ----
  function beginDrag(info: DragInfo, rect: DOMRect, x: number, y: number) {
    if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
    setActionMenuId(null); setMenuEntity(null); setMenuAnchorRect(null);
    const target = info.type === "card"
      ? orderedRootCats.findIndex(c => c.id === info.id)
      : orderedRootCats.length;
    setDragState({ ...info, w: rect.width, h: rect.height, ox: x - rect.left, oy: y - rect.top, x, y, target });
  }

  function onCatPointerDown(e: React.PointerEvent, info: DragInfo) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-menu]")) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    if (dragGestRef.current?.timer) clearTimeout(dragGestRef.current.timer);
    dragGestRef.current = {
      info, rect, x0: x, y0: y, started: false,
      timer: setTimeout(() => {
        if (dragGestRef.current) {
          dragGestRef.current.started = true;
          beginDrag(info, dragGestRef.current.rect, x, y);
        }
      }, LONGPRESS_MS),
    };
  }

  async function refreshCategories() {
    const loaded = await listFinanceCategories();
    setCategories(loaded);
  }

  async function handleSubmitCategory() {
    const name = newName.trim();
    if (!name) { setFeedback("Informe o nome da categoria."); return; }
    try {
      setSaving(true); setFeedback(null);
      if (editingId) {
        await updateFinanceCategory(editingId, name, selectedIcon, selectedColor);
      } else {
        await createFinanceCategory(activeType, name, newParentId || null, selectedIcon, selectedColor);
      }
      await refreshCategories();
      setNewName(""); setNewParentId(""); setEditingId(null); setEditingName(""); setComposerOpen(false);
      setFeedback(editingId ? "Categoria atualizada." : newParentId ? "Subcategoria criada com sucesso." : "Categoria criada com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  function drillInto(id: string) { setDrillAnim("cat-drill-in"); setDrillPath(prev => [...prev, id]); }
  function drillBack() { setDrillAnim("cat-drill-back"); setDrillPath(prev => prev.slice(0, -1)); }
  function drillGoTo(depth: number) { setDrillAnim("cat-drill-back"); setDrillPath(prev => prev.slice(0, depth)); }

  function openCreate(parentId = "") {
    setNewName(""); setNewParentId(parentId); setEditingId(null); setEditingName("");
    setSelectedIcon(parentId ? parentOptions.find(c => c.id === parentId)?.icon ?? "💼" : "💼");
    setSelectedColor(parentId ? parentOptions.find(c => c.id === parentId)?.color ?? "#60a5fa" : "#60a5fa");
    setFeedback(null); setActionMenuId(null); setMenuEntity(null); setMenuAnchorRect(null);
    setShowAllColors(false); setShowAllIcons(false); setComposerOpen(true);
  }

  function startEdit(category: FinanceCategoryOption) {
    setEditingId(category.id); setEditingName(category.name); setNewName(category.name);
    setNewParentId(category.parentId ?? ""); setSelectedIcon(category.icon ?? "💼");
    setSelectedColor(category.color ?? "#60a5fa"); setFeedback(null);
    setActionMenuId(null); setMenuEntity(null); setMenuAnchorRect(null);
    setShowAllColors(false); setShowAllIcons(false); setComposerOpen(true);
  }

  async function handleDelete(category: FinanceCategoryOption) {
    if (!confirm(`Remover a categoria "${category.name}"?`)) return;
    try {
      setSaving(true); setFeedback(null);
      await deleteFinanceCategory(category.id);
      setCategories(current => current.filter(item => item.id !== category.id));
      setActionMenuId(null); setFeedback("Categoria removida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
      await refreshCategories().catch(() => undefined);
    } finally { setSaving(false); }
  }

  async function handleDeleteDrillNode(category: FinanceCategoryOption) {
    if (!confirm(`Remover "${category.name}"?`)) return;
    try {
      setSaving(true); setFeedback(null);
      await deleteFinanceCategory(category.id);
      setCategories(current => current.filter(item => item.id !== category.id));
      setActionMenuId(null); drillBack(); setFeedback("Categoria removida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
      await refreshCategories().catch(() => undefined);
    } finally { setSaving(false); }
  }

  function openMove(cat: FinanceCategoryOption) {
    setActionMenuId(null); setMenuEntity(null); setMenuAnchorRect(null); setMoveItem(cat);
  }

  function openMenu(e: React.MouseEvent, entity: FinanceCategoryOption) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (actionMenuId === entity.id) {
      setActionMenuId(null); setMenuEntity(null); setMenuAnchorRect(null);
    } else {
      setActionMenuId(entity.id); setMenuEntity(entity); setMenuAnchorRect(rect);
    }
  }

  function closeMenu() { setActionMenuId(null); setMenuEntity(null); setMenuAnchorRect(null); }

  async function handleApplyMove({ targetType, targetParentId, mode }: MoveOpts) {
    const item = moveItem!;
    try {
      setSaving(true); setFeedback(null);
      if (mode === "self") {
        const directChildren = categories.filter(c => c.parentId === item.id);
        await moveFinanceCategory(item, targetType, targetParentId);
        for (const child of directChildren) await moveFinanceCategory(child, child.type, item.parentId ?? null);
      } else {
        await moveFinanceCategory(item, targetType, targetParentId);
        if (targetType !== item.type) {
          const desc = descendantIds(categories, item.id);
          const descList = categories.filter(c => desc.has(c.id));
          for (const d of descList) await moveFinanceCategory(d, targetType, d.parentId ?? null);
        }
      }
      await refreshCategories();
      setActiveType(targetType); setDrillPath([]); setMoveItem(null);
      const where = targetParentId
        ? `para dentro de "${categories.find(c => c.id === targetParentId)?.name ?? ""}"`
        : `para a raiz de ${targetType === "RECEITA" ? "Recebimentos" : "Gastos"}`;
      setFeedback(`"${item.name}" movida ${where}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível mover a categoria.");
      await refreshCategories().catch(() => undefined);
    } finally { setSaving(false); }
  }

  const selectedParent = parentOptions.find(c => c.id === newParentId);
  const visibleColorOptions = showAllColors ? categoryColors : categoryColors.slice(0, 3);
  const visibleIconOptions = showAllIcons ? categoryEmojis : categoryEmojis.slice(0, 3);

  return (
    <div className={`finance-view categories-view${animate ? " is-ready" : ""}${composerOpen ? " is-composer-open" : ""}`}>
      <section className="finance-hero">
        <div>
          <span className="finance-kicker">Organizacao</span>
          <h2>Categorias</h2>
        </div>
        <p>Personalize como suas receitas e despesas aparecem nos lancamentos e no dashboard.</p>
      </section>

      <div className="chart-card finance-panel categories-panel">
        {!drillNode ? (
          <div className="finance-section-heading">
            <div>
              <span className="finance-kicker">{typeLabels[activeType].kicker}</span>
              <h3>{typeLabels[activeType].title}</h3>
            </div>

            <div className="categories-tabs" aria-label="Tipo de categoria">
              {(["RECEITA", "DESPESA"] as FinanceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={activeType === type ? "is-active" : ""}
                  onClick={() => {
                    setActiveType(type);
                    setNewParentId("");
                    setEditingId(null);
                    setFeedback(null);
                    setDrillPath([]);
                    setDrillAnim("");
                    setDragState(null);
                    if (dragGestRef.current?.timer) clearTimeout(dragGestRef.current.timer);
                    dragGestRef.current = null;
                  }}
                >
                  {type === "RECEITA" ? "Recebimentos" : "Gastos"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {feedback ? <div className="finance-feedback">{feedback}</div> : null}

        {loading ? (
          <div className="finance-empty-state">
            <strong>Carregando categorias...</strong>
          </div>
        ) : drillNode ? (
          <div className={`cat-drillview ${drillAnim}`} key={drillPath.join("-")}>
            <div className="cat-drill-head">
              <button type="button" className="cat-drill-back-btn" aria-label="Voltar" onClick={drillBack}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="cat-drill-crumb">
                  {drillAncestors.map((anc, idx) => (
                    <span key={idx}>
                      <b role="button" tabIndex={0} onClick={() => drillGoTo(anc.depth)} onKeyDown={(e) => { if (e.key === "Enter") drillGoTo(anc.depth); }}>{anc.name}</b>
                      <span className="cat-drill-sep"> › </span>
                    </span>
                  ))}
                </div>
                <div className="cat-drill-title">
                  <span className="cat-drill-dot" style={{ background: drillNode.color ?? "#60a5fa" }} />
                  <span className="cat-drill-name">{drillNode.name}</span>
                  <span className="cat-drill-pill">
                    {(drillNode.level ?? 2) <= 1 ? "categoria" : (drillNode.level ?? 2) <= 2 ? "subcategoria" : "sub-subcategoria"}
                  </span>
                </div>
              </div>
              <div className="cat-drill-head-acts">
                <button type="button" className="categories-icon-button" aria-label="Mais opções" onClick={(e) => openMenu(e, drillNode)}>
                  •••
                </button>
              </div>
            </div>

            <div className="cat-drill-list">
              {(drillNode.level ?? 2) < 3 ? (
                <button type="button" className="cat-drill-addrow" onClick={() => openCreate(drillNode.id)}>
                  <span className="cat-drill-ap">+</span>
                  <span className="cat-drill-addrow-txt">Nova {(drillNode.level ?? 2) >= 2 ? "sub-subcategoria" : "subcategoria"} em {drillNode.name}</span>
                </button>
              ) : null}

              {drillChildren.length === 0 ? (
                <div className="cat-drill-empty">Nenhuma subcategoria em "{drillNode.name}" ainda.</div>
              ) : (
                drillChildren.map(child => {
                  const grandchildren = childrenByParentId.get(child.id) ?? [];
                  const childColor = child.color ?? "#60a5fa";
                  return (
                    <div
                      key={child.id}
                      className="cat-drill-subrow"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; drillInto(child.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") drillInto(child.id); }}
                    >
                      <span className="cat-drill-si" style={{ background: childColor + "26" }}>{child.icon ?? "💼"}</span>
                      <div className="cat-drill-sm">
                        <strong>{child.name}</strong>
                        <span>{grandchildren.length > 0 ? `${grandchildren.length} ${grandchildren.length === 1 ? "subcategoria" : "subcategorias"}` : "sem subcategorias"}</span>
                      </div>
                      <div className="cat-drill-row-acts">
                        <button data-menu type="button" className="categories-icon-button" aria-label="Mais opções" onClick={(e) => openMenu(e, child)}>
                          •••
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className={drillAnim || undefined} key="grid">
            {/* Drag hint banner */}
            {dragState && (
              <div className="cat-drag-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                </svg>
                {dragState.type === "nova" ? "Solte onde quiser criar a categoria" : "Solte para reordenar"}
              </div>
            )}

            {/* Nova categoria — wide draggable button */}
            <button
              type="button"
              className={"cat-nova-btn" + (dragState?.type === "nova" ? " is-source" : "")}
              onPointerDown={(e) => onCatPointerDown(e, { type: "nova" })}
            >
              <span className="cat-nova-ic">+</span>
              <span className="cat-nova-tx">
                <strong>Nova categoria</strong>
                <span>Segure e arraste para posicionar</span>
              </span>
              <span className="cat-nova-grip"><i /><i /><i /><i /><i /><i /></span>
            </button>

            {/* Cards grid */}
            <div className="cat-grid" ref={gridRef}>
              {gridSlots.map(slot =>
                slot.kind === "ph" ? (
                  <div
                    key={slot.key}
                    data-drag-slot
                    className={"cat-drag-placeholder" + (dragState?.type === "nova" ? " is-nova" : "")}
                  >
                    {dragState?.type === "nova" ? "Nova categoria aqui" : ""}
                  </div>
                ) : (
                  <div
                    key={slot.key}
                    data-drag-slot
                    className={"cat-card card" + (slot.cat.id === dragState?.id ? " is-drag-source" : "")}
                    style={{ animationDelay: `${orderedRootCats.indexOf(slot.cat) * 0.06}s` }}
                    onPointerDown={(e) => onCatPointerDown(e, { type: "card", id: slot.cat.id })}
                  >
                    <div className="cat-card-top">
                      <span className="cat-ic" style={{ background: (slot.cat.color ?? "#60a5fa") + "26", fontSize: 20 }}>
                        {slot.cat.icon ?? "💼"}
                      </span>
                      <div className="cat-card-menu">
                        <button
                          data-menu
                          type="button"
                          className="categories-icon-button"
                          aria-label="Mais opções"
                          onClick={(e) => openMenu(e, slot.cat)}
                        >
                          •••
                        </button>
                      </div>
                    </div>

                    <div className="cat-card-id">
                      <h4>{slot.cat.name}</h4>
                      <div className="cat-card-meta">
                        {(childrenByParentId.get(slot.cat.id) ?? []).length}{" "}
                        {(childrenByParentId.get(slot.cat.id) ?? []).length === 1 ? "subcategoria" : "subcategorias"}
                      </div>
                    </div>

                    <div className="cat-bar">
                      <i style={{ width: "100%", background: slot.cat.color ?? "#60a5fa" }} />
                    </div>

                    {(childrenByParentId.get(slot.cat.id) ?? []).length > 0 ? (
                      <div className="subcats">
                        {(childrenByParentId.get(slot.cat.id) ?? []).slice(0, 5).map(child => (
                          <span
                            key={child.id}
                            className="subcat"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); drillInto(child.id); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); drillInto(child.id); } }}
                          >
                            {child.icon} {child.name}
                          </span>
                        ))}
                        {(childrenByParentId.get(slot.cat.id) ?? []).length > 5 ? (
                          <span
                            className="subcat subcat-more"
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); drillInto(slot.cat.id); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); drillInto(slot.cat.id); } }}
                          >
                            +{(childrenByParentId.get(slot.cat.id) ?? []).length - 5} ver todas
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating drag clone */}
      {dragState && typeof document !== "undefined" ? createPortal(
        <div
          className="cat-drag-clone"
          style={{
            left: dragState.x - dragState.ox,
            top: dragState.y - dragState.oy,
            width: dragState.w,
          }}
        >
          {dragState.type === "nova" ? (
            <button type="button" className="cat-nova-btn" style={{ margin: 0, width: dragState.w }}>
              <span className="cat-nova-ic">+</span>
              <span className="cat-nova-tx">
                <strong>Nova categoria</strong>
                <span>Segure e arraste para posicionar</span>
              </span>
              <span className="cat-nova-grip"><i /><i /><i /><i /><i /><i /></span>
            </button>
          ) : draggedCat ? (
            <div className="cat-card card" style={{ width: dragState.w }}>
              <div className="cat-card-top">
                <span className="cat-ic" style={{ background: (draggedCat.color ?? "#60a5fa") + "26", fontSize: 20 }}>
                  {draggedCat.icon ?? "💼"}
                </span>
              </div>
              <div className="cat-card-id">
                <h4>{draggedCat.name}</h4>
                <div className="cat-card-meta">
                  {(childrenByParentId.get(draggedCat.id) ?? []).length} subcategorias
                </div>
              </div>
              <div className="cat-bar">
                <i style={{ width: "100%", background: draggedCat.color ?? "#60a5fa" }} />
              </div>
            </div>
          ) : null}
        </div>,
        document.body,
      ) : null}

      {/* Composer */}
      {composerOpen && typeof document !== "undefined" ? createPortal(
        <div className="categories-composer-backdrop" role="presentation">
          <div className="categories-composer-sheet categories-composer-sheet-compact" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="categories-composer-head">
              <div>
                <span className="finance-kicker">{editingId ? "Editar categoria" : newParentId ? "Nova subcategoria" : "Nova categoria"}</span>
                <h3>{editingId ? editingName : newParentId ? selectedParent?.name ?? "Subcategoria" : typeLabels[activeType].title}</h3>
                {selectedParent ? <p>Dentro de {selectedParent.fullPath ?? selectedParent.name}</p> : null}
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setComposerOpen(false)}>x</button>
            </div>

            <label className="finance-field categories-description-field">
              <span>Descrição</span>
              <input
                className="finance-control"
                placeholder={typeLabels[activeType].placeholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSubmitCategory(); }}
                autoFocus
              />
            </label>

            <div className="category-option-row">
              <span className="category-option-label">Cor</span>
              <div className={`category-color-grid${showAllColors ? " is-expanded" : ""}`}>
                {visibleColorOptions.map(color => (
                  <button key={color} type="button" className={selectedColor === color ? "is-selected" : ""} style={{ backgroundColor: color }} aria-label={`Selecionar cor ${color}`} onClick={() => setSelectedColor(color)} />
                ))}
                <button type="button" className="category-more-button" onClick={() => setShowAllColors(v => !v)}>
                  {showAllColors ? "Menos" : "Outros..."}
                </button>
              </div>
            </div>

            <div className="category-option-row">
              <span className="category-option-label">Ícone</span>
              <div className={`category-emoji-grid category-emoji-grid-inline${showAllIcons ? " is-expanded" : ""}`}>
                {visibleIconOptions.map(emoji => (
                  <button key={emoji} type="button" className={selectedIcon === emoji ? "is-selected" : ""} onClick={() => setSelectedIcon(emoji)}>
                    {emoji}
                  </button>
                ))}
                <button type="button" className="category-more-button" onClick={() => setShowAllIcons(v => !v)}>
                  {showAllIcons ? "Menos" : "Outros..."}
                </button>
              </div>
            </div>

            <button className="finance-primary-button categories-composer-submit" type="button" disabled={saving} onClick={handleSubmitCategory}>
              {editingId ? "Salvar categoria" : newParentId ? "Adicionar subcategoria" : "Adicionar categoria"}
            </button>
          </div>
        </div>,
        document.body,
      ) : null}

      {/* Card action menu */}
      {menuEntity && menuAnchorRect && typeof document !== "undefined" ? createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={closeMenu} onContextMenu={closeMenu} />
          <div
            className="categories-menu"
            style={{
              position: "fixed",
              zIndex: 1000,
              top: menuAnchorRect.bottom + 8 + window.scrollY > window.innerHeight - 160
                ? menuAnchorRect.top - 8
                : menuAnchorRect.bottom + 8,
              right: window.innerWidth - menuAnchorRect.right,
              transform: menuAnchorRect.bottom + 8 + window.scrollY > window.innerHeight - 160
                ? "translateY(-100%)"
                : "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => { closeMenu(); startEdit(menuEntity); }}>Editar</button>
            {(menuEntity.level ?? 1) < 3 && !menuEntity.parentId ? (
              <button type="button" onClick={() => { closeMenu(); openCreate(menuEntity.id); }}>+ Sub</button>
            ) : null}
            <button type="button" className="mv-menu-item" onClick={() => { closeMenu(); openMove(menuEntity); }}>
              <MoveIcon /> Mover
            </button>
            <button type="button" disabled={saving} onClick={() => {
              const entity = menuEntity;
              const isDrillHead = entity.id === drillNode?.id;
              closeMenu();
              if (isDrillHead) void handleDeleteDrillNode(entity); else void handleDelete(entity);
            }}>Remover</button>
          </div>
        </>,
        document.body,
      ) : null}

      {moveItem ? (
        <MoverCategoriaSheet
          cats={categories}
          item={moveItem}
          onClose={() => setMoveItem(null)}
          onApply={(opts) => void handleApplyMove(opts)}
        />
      ) : null}
    </div>
  );
}
