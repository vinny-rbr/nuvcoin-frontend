import { useEffect, useMemo, useState } from "react";
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [composerOpen, setComposerOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);

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

    if (parentId) {
      setExpandedIds((current) => {
        const next = new Set(current);
        next.add(parentId);
        return next;
      });
    }
  }

  function toggleCategory(categoryId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function renderCategoryRow(category: FinanceCategoryOption) {
    const children = childrenByParentId.get(category.id) ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const canAddChild = (category.level ?? 1) < 3;

    return (
      <div key={category.id} className="categories-tree-item">
        <div className={`categories-row categories-row-level-${category.level ?? 1}`}>
          <div className="categories-row-main">
            <button
              className={`categories-expand-button${hasChildren ? "" : " is-empty"}`}
              type="button"
              disabled={!hasChildren}
              aria-label={isExpanded ? "Fechar subcategorias" : "Abrir subcategorias"}
              onClick={() => toggleCategory(category.id)}
            >
              {hasChildren ? (isExpanded ? "-" : "+") : ""}
            </button>
            <span className="categories-emoji-badge" style={{ backgroundColor: category.color ?? "#60a5fa" }}>
              {category.icon ?? "💼"}
            </span>
            <div className="categories-name-stack">
              <strong>{category.name}</strong>
              <span>{category.fullPath ?? category.name}</span>
            </div>
          </div>

          <div className="categories-actions">
            {canAddChild ? (
              <button
                className="categories-icon-button"
                type="button"
                aria-label="Adicionar subcategoria"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  openCreate(category.id);
                }}
              >
                +
              </button>
            ) : null}
            <div className="categories-menu-wrap">
              <button
                className="categories-icon-button"
                type="button"
                aria-label="Mais opcoes"
                onClick={() => setActionMenuId((current) => (current === category.id ? null : category.id))}
              >
                ...
              </button>
              {actionMenuId === category.id ? (
                <div className="categories-menu">
                  <button type="button" onClick={() => startEdit(category)}>
                    Editar
                  </button>
                  <button type="button" disabled={saving} onClick={() => handleDelete(category)}>
                    Remover
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded ? (
          <div className="categories-tree-children">
            {children.map((child) => renderCategoryRow(child))}
          </div>
        ) : null}
      </div>
    );
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
                }}
              >
                {type === "RECEITA" ? "Recebimentos" : "Gastos"}
              </button>
            ))}
          </div>
        </div>

        {feedback ? <div className="finance-feedback">{feedback}</div> : null}

        {loading ? (
          <div className="finance-empty-state">
            <strong>Carregando categorias...</strong>
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">+</div>
            <strong>{typeLabels[activeType].empty}</strong>
            <span>Crie uma categoria acima para comecar.</span>
          </div>
        ) : (
          <div className="categories-list">
            {rootCategories.map((category) => renderCategoryRow(category))}
          </div>
        )}

        <button
          className="categories-fab"
          type="button"
          aria-label="Adicionar categoria"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            openCreate();
          }}
        >
          +
        </button>

      </div>

      {composerOpen ? (
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
        </div>
      ) : null}
    </div>
  );
}
