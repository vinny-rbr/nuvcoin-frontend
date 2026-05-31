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

export default function Categorias() {
  const [categories, setCategories] = useState<FinanceCategoryOption[]>([]);
  const [activeType, setActiveType] = useState<FinanceType>("RECEITA");
  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [composerOpen, setComposerOpen] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

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

  async function refreshCategories() {
    const loaded = await listFinanceCategories();
    setCategories(loaded);
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) {
      setFeedback("Informe o nome da categoria.");
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await createFinanceCategory(activeType, name, newParentId || null);
      await refreshCategories();
      setNewName("");
      setNewParentId("");
      setComposerOpen(false);
      setFeedback(newParentId ? "Subcategoria criada com sucesso." : "Categoria criada com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel criar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  function openCreate(parentId = "") {
    setNewName("");
    setNewParentId(parentId);
    setFeedback(null);
    setActionMenuId(null);
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
    const isEditing = editingId === category.id;
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
            <span className="finance-row-icon">{activeType === "RECEITA" ? "+" : "-"}</span>
            {isEditing ? (
              <input
                className="finance-control"
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleSaveEdit();
                  if (event.key === "Escape") setEditingId(null);
                }}
                autoFocus
              />
            ) : (
              <div className="categories-name-stack">
                <strong>{category.name}</strong>
                <span>{category.fullPath ?? category.name}</span>
              </div>
            )}
          </div>

          <div className="categories-actions">
            {isEditing ? (
              <>
                <button className="categories-secondary-button" type="button" onClick={() => setEditingId(null)}>
                  Cancelar
                </button>
                <button className="finance-primary-button" type="button" disabled={saving} onClick={handleSaveEdit}>
                  Salvar
                </button>
              </>
            ) : (
              <>
                {canAddChild ? (
                  <button className="categories-icon-button" type="button" aria-label="Adicionar subcategoria" onClick={() => openCreate(category.id)}>
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
              </>
            )}
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
    setFeedback(null);
    setActionMenuId(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return;

    const name = editingName.trim();
    if (!name) {
      setFeedback("Informe o nome da categoria.");
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await updateFinanceCategory(editingId, name);
      await refreshCategories();
      setEditingId(null);
      setEditingName("");
      setFeedback("Categoria atualizada. Os lancamentos antigos tambem foram ajustados.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel atualizar a categoria.");
    } finally {
      setSaving(false);
    }
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

  return (
    <div className={`finance-view categories-view${animate ? " is-ready" : ""}`}>
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

        <button className="categories-fab" type="button" aria-label="Adicionar categoria" onClick={() => openCreate()}>
          +
        </button>

        {composerOpen ? (
          <div className="categories-composer-backdrop" role="presentation" onClick={() => setComposerOpen(false)}>
            <div className="categories-composer-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <div className="categories-composer-head">
                <div>
                  <span className="finance-kicker">{newParentId ? "Nova subcategoria" : "Nova categoria"}</span>
                  <h3>{newParentId ? selectedParent?.name ?? "Subcategoria" : typeLabels[activeType].title}</h3>
                  {selectedParent ? <p>Dentro de {selectedParent.fullPath ?? selectedParent.name}</p> : null}
                </div>
                <button type="button" aria-label="Fechar" onClick={() => setComposerOpen(false)}>
                  x
                </button>
              </div>

              <label className="finance-field">
                <span>Nome</span>
                <input
                  className="finance-control"
                  placeholder={typeLabels[activeType].placeholder}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleCreate();
                  }}
                  autoFocus
                />
              </label>

              <button className="finance-primary-button" type="button" disabled={saving} onClick={handleCreate}>
                {newParentId ? "Adicionar subcategoria" : "Adicionar categoria"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
