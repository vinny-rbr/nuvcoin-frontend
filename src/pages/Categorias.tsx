import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { FinanceCategoryOption, FinanceType } from "../types/finance";
import {
  createFinanceCategory,
  deleteFinanceCategory,
  listFinanceCategories,
  updateFinanceCategory,
} from "../lib/financeCategoriesService";
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
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [drillAnim, setDrillAnim] = useState<string>("");

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

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setAnimate(false);
    const timeoutId = window.setTimeout(() => setAnimate(true), 40);
    return () => window.clearTimeout(timeoutId);
  }, [activeType, categories.length]);

  useEffect(() => {
    if (!composerOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [composerOpen]);

  async function refreshCategories() {
    const loaded = await listFinanceCategories();
    setCategories(loaded);
  }

  async function handleSubmitCategory() {
    const name = newName.trim();
    if (!name) {
      setFeedback("Informe o nome da categoria.");
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      if (editingId) {
        await updateFinanceCategory(editingId, name, selectedIcon, selectedColor);
      } else {
        await createFinanceCategory(activeType, name, newParentId || null, selectedIcon, selectedColor);
      }

      await refreshCategories();
      setNewName("");
      setNewParentId("");
      setEditingId(null);
      setEditingName("");
      setComposerOpen(false);
      setFeedback(editingId ? "Categoria atualizada." : newParentId ? "Subcategoria criada com sucesso." : "Categoria criada com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  function drillInto(id: string) {
    setDrillAnim("cat-drill-in");
    setDrillPath((prev) => [...prev, id]);
  }

  function drillBack() {
    setDrillAnim("cat-drill-back");
    setDrillPath((prev) => prev.slice(0, -1));
  }

  function drillGoTo(depth: number) {
    setDrillAnim("cat-drill-back");
    setDrillPath((prev) => prev.slice(0, depth));
  }

  function openCreate(parentId = "") {
    setNewName("");
    setNewParentId(parentId);
    setEditingId(null);
    setEditingName("");
    setSelectedIcon(parentId ? parentOptions.find((category) => category.id === parentId)?.icon ?? "💼" : "💼");
    setSelectedColor(parentId ? parentOptions.find((category) => category.id === parentId)?.color ?? "#60a5fa" : "#60a5fa");
    setFeedback(null);
    setActionMenuId(null);
    setShowAllColors(false);
    setShowAllIcons(false);
    setComposerOpen(true);

  }

  function startEdit(category: FinanceCategoryOption) {
    setEditingId(category.id);
    setEditingName(category.name);
    setNewName(category.name);
    setNewParentId(category.parentId ?? "");
    setSelectedIcon(category.icon ?? "💼");
    setSelectedColor(category.color ?? "#60a5fa");
    setFeedback(null);
    setActionMenuId(null);
    setShowAllColors(false);
    setShowAllIcons(false);
    setComposerOpen(true);
  }

  async function handleDelete(category: FinanceCategoryOption) {
    const ok = confirm(`Remover a categoria "${category.name}"?`);
    if (!ok) return;

    try {
      setSaving(true);
      setFeedback(null);
      await deleteFinanceCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setActionMenuId(null);
      setFeedback("Categoria removida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
      await refreshCategories().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDrillNode(category: FinanceCategoryOption) {
    const ok = confirm(`Remover "${category.name}"?`);
    if (!ok) return;

    try {
      setSaving(true);
      setFeedback(null);
      await deleteFinanceCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setActionMenuId(null);
      drillBack();
      setFeedback("Categoria removida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
      await refreshCategories().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  const selectedParent = parentOptions.find((category) => category.id === newParentId);
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
                    {(drillNode.level ?? 2) <= 2 ? "subcategoria" : "sub-subcategoria"}
                  </span>
                </div>
              </div>
              <div className="cat-drill-head-acts">
                <button
                  type="button"
                  className="categories-icon-button"
                  aria-label="Mais opções"
                  onClick={() => setActionMenuId((c) => c === drillNode.id ? null : drillNode.id)}
                >
                  •••
                </button>
                {actionMenuId === drillNode.id ? (
                  <div className="categories-menu">
                    <button type="button" onClick={() => startEdit(drillNode)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      Editar
                    </button>
                    <button type="button" disabled={saving} onClick={() => void handleDeleteDrillNode(drillNode)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      Remover
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="cat-drill-list">
              {(drillNode.level ?? 2) < 3 ? (
                <button
                  type="button"
                  className="cat-drill-addrow"
                  onClick={() => openCreate(drillNode.id)}
                >
                  <span className="cat-drill-ap">+</span>
                  <span className="cat-drill-addrow-txt">Nova {(drillNode.level ?? 2) >= 2 ? "sub-subcategoria" : "subcategoria"} em {drillNode.name}</span>
                </button>
              ) : null}

              {drillChildren.length === 0 ? (
                <div className="cat-drill-empty">
                  Nenhuma subcategoria em "{drillNode.name}" ainda.
                </div>
              ) : (
                drillChildren.map((child) => {
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
                      <span className="cat-drill-si" style={{ background: childColor + "26" }}>
                        {child.icon ?? "💼"}
                      </span>
                      <div className="cat-drill-sm">
                        <strong>{child.name}</strong>
                        <span>
                          {grandchildren.length > 0
                            ? `${grandchildren.length} ${grandchildren.length === 1 ? "subcategoria" : "subcategorias"}`
                            : "sem subcategorias"}
                        </span>
                      </div>
                      <div className="cat-drill-row-acts">
                        <button
                          type="button"
                          className="categories-icon-button"
                          aria-label="Mais opções"
                          onClick={(e) => { e.stopPropagation(); setActionMenuId((c) => c === child.id ? null : child.id); }}
                        >
                          •••
                        </button>
                        {actionMenuId === child.id ? (
                          <div className="categories-menu">
                            <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(child); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              Editar
                            </button>
                            <button type="button" disabled={saving} onClick={(e) => { e.stopPropagation(); void handleDelete(child); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
                              Remover
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className={drillAnim || undefined} key="grid">
            <div className="cat-grid">
              <button
                type="button"
                className="cat-new-tile"
                aria-label="Criar nova categoria"
                onClick={() => openCreate()}
              >
                <span className="cat-new-tile-ic">+</span>
                <strong>Nova</strong>
              </button>

              {rootCategories.map((category, idx) => {
                const children = childrenByParentId.get(category.id) ?? [];
                const color = category.color ?? "#60a5fa";
                const colorAlpha = color + "26";
                return (
                  <div
                    key={category.id}
                    className="cat-card card"
                    style={{ animationDelay: `${idx * 0.06}s` }}
                  >
                    <div className="cat-card-top">
                      <span className="cat-ic" style={{ background: colorAlpha, fontSize: 20 }}>
                        {category.icon ?? "💼"}
                      </span>
                      <div className="cat-card-menu">
                        <button
                          type="button"
                          className="categories-icon-button"
                          aria-label="Mais opções"
                          onClick={(e) => { e.stopPropagation(); setActionMenuId((c) => c === category.id ? null : category.id); }}
                        >
                          •••
                        </button>
                        {actionMenuId === category.id ? (
                          <div className="categories-menu">
                            <button type="button" onClick={() => startEdit(category)}>Editar</button>
                            {(category.level ?? 1) < 3 ? (
                              <button type="button" onClick={() => openCreate(category.id)}>+ Sub</button>
                            ) : null}
                            <button type="button" disabled={saving} onClick={() => handleDelete(category)}>Remover</button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="cat-card-id">
                      <h4>{category.name}</h4>
                      <div className="cat-card-meta">
                        {children.length} {children.length === 1 ? "subcategoria" : "subcategorias"}
                      </div>
                    </div>

                    <div className="cat-bar">
                      <i style={{ width: "100%", background: color }} />
                    </div>

                    {children.length > 0 ? (
                      <div className="subcats">
                        {children.slice(0, 5).map((child) => (
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
                        {children.length > 5 ? (
                          <span className="subcat">{`+${children.length - 5}`}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {composerOpen && typeof document !== "undefined" ? createPortal(
        <div className="categories-composer-backdrop" role="presentation">
          <div className="categories-composer-sheet categories-composer-sheet-compact" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="categories-composer-head">
              <div>
                <span className="finance-kicker">{editingId ? "Editar categoria" : newParentId ? "Nova subcategoria" : "Nova categoria"}</span>
                <h3>{editingId ? editingName : newParentId ? selectedParent?.name ?? "Subcategoria" : typeLabels[activeType].title}</h3>
                {selectedParent ? <p>Dentro de {selectedParent.fullPath ?? selectedParent.name}</p> : null}
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setComposerOpen(false)}>
                x
              </button>
            </div>

            <label className="finance-field categories-description-field">
              <span>Descrição</span>
              <input
                className="finance-control"
                placeholder={typeLabels[activeType].placeholder}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleSubmitCategory();
                }}
                autoFocus
              />
            </label>

            <div className="category-option-row">
              <span className="category-option-label">Cor</span>
              <div className={`category-color-grid${showAllColors ? " is-expanded" : ""}`}>
                {visibleColorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={selectedColor === color ? "is-selected" : ""}
                    style={{ backgroundColor: color }}
                    aria-label={`Selecionar cor ${color}`}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
                <button
                  type="button"
                  className="category-more-button"
                  onClick={() => setShowAllColors((current) => !current)}
                >
                  {showAllColors ? "Menos" : "Outros..."}
                </button>
              </div>
            </div>

            <div className="category-option-row">
              <span className="category-option-label">Ícone</span>
              <div className={`category-emoji-grid category-emoji-grid-inline${showAllIcons ? " is-expanded" : ""}`}>
                {visibleIconOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={selectedIcon === emoji ? "is-selected" : ""}
                    onClick={() => setSelectedIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="category-more-button"
                  onClick={() => setShowAllIcons((current) => !current)}
                >
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
    </div>
  );
}
