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
      setFeedback(newParentId ? "Subcategoria criada com sucesso." : "Categoria criada com sucesso.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel criar a categoria.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: FinanceCategoryOption) {
    setEditingId(category.id);
    setEditingName(category.name);
    setFeedback(null);
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
      setFeedback("Categoria removida.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel remover a categoria.");
      await refreshCategories().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

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

        <div className="categories-create-row">
          <label className="finance-field">
            <span>Novo nome</span>
            <input
              className="finance-control"
              placeholder={typeLabels[activeType].placeholder}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
            />
          </label>
          <label className="finance-field">
            <span>Dentro de</span>
            <select className="finance-control" value={newParentId} onChange={(event) => setNewParentId(event.target.value)}>
              <option value="">Categoria principal</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.fullPath ?? category.name}
                </option>
              ))}
            </select>
          </label>
          <button className="finance-primary-button" type="button" disabled={saving} onClick={handleCreate}>
            {newParentId ? "Adicionar subcategoria" : "Adicionar categoria"}
          </button>
        </div>

        {loading ? (
          <div className="finance-empty-state">
            <strong>Carregando categorias...</strong>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">+</div>
            <strong>{typeLabels[activeType].empty}</strong>
            <span>Crie uma categoria acima para comecar.</span>
          </div>
        ) : (
          <div className="categories-list">
            {visibleCategories.map((category) => {
              const isEditing = editingId === category.id;

              return (
                <div key={category.id} className="categories-row">
                  <div className="categories-row-main">
                    <span className="finance-row-icon">{activeType === "RECEITA" ? "+" : "-"}</span>
                    <span className="categories-level-pill">Nivel {category.level ?? 1}</span>
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
                        <button className="categories-secondary-button" type="button" onClick={() => startEdit(category)}>
                          Editar
                        </button>
                        <button className="finance-danger-button" type="button" disabled={saving} onClick={() => handleDelete(category)}>
                          Remover
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
