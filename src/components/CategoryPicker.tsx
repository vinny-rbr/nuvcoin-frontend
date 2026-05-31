import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type CategoryPickerProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreateCategory?: (name: string, parentPath?: string) => Promise<string>;
};

function splitCategoryPath(value: string): string[] {
  return value
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function CategoryPicker({ label, value, options, onChange, onCreateCategory }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [prefix, setPrefix] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const selectedParts = useMemo(() => splitCategoryPath(value), [value]);
  const normalizedOptions = useMemo(
    () =>
      Array.from(new Set(options))
        .map((option) => ({ value: option, parts: splitCategoryPath(option) }))
        .filter((option) => option.parts.length > 0)
        .sort((a, b) => a.value.localeCompare(b.value)),
    [options],
  );

  const visibleOptions = useMemo(() => {
    const nextLevel = prefix.length + 1;

    return normalizedOptions.filter((option) => {
      if (option.parts.length !== nextLevel) return false;
      return prefix.every((part, index) => option.parts[index] === part);
    });
  }, [normalizedOptions, prefix]);

  const currentTitle = prefix.at(-1) ?? "Categorias";

  function hasChildren(parts: string[]): boolean {
    return normalizedOptions.some((option) => {
      if (option.parts.length <= parts.length) return false;
      return parts.every((part, index) => option.parts[index] === part);
    });
  }

  function openPicker() {
    setPrefix([]);
    setCreating(false);
    setNewName("");
    setCreateError(null);
    setOpen(true);
  }

  async function handleCreateCategory() {
    if (!onCreateCategory) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setCreateError("Informe o nome da categoria.");
      return;
    }

    try {
      setSavingNew(true);
      setCreateError(null);
      const createdValue = await onCreateCategory(trimmedName, prefix.length > 0 ? prefix.join(" > ") : undefined);
      onChange(createdValue);
      setOpen(false);
      setCreating(false);
      setNewName("");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Nao foi possivel criar a categoria.");
    } finally {
      setSavingNew(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const picker = open
    ? createPortal(
        <div className="category-picker-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="category-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Selecionar categoria"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="category-picker-head">
              <div>
                <span>{prefix.length === 0 ? "Organizacao" : "Dentro de"}</span>
                <strong>{currentTitle}</strong>
              </div>
              <div className="category-picker-head-actions">
                {onCreateCategory ? (
                  <button type="button" aria-label="Criar categoria" onClick={() => setCreating((current) => !current)}>
                    +
                  </button>
                ) : null}
                {prefix.length > 0 ? (
                  <button type="button" aria-label="Voltar nivel" onClick={() => setPrefix((current) => current.slice(0, -1))}>
                    {"<"}
                  </button>
                ) : null}
                <button type="button" aria-label="Fechar categorias" onClick={() => setOpen(false)}>
                  x
                </button>
              </div>
            </div>

            {creating ? (
              <div className="category-picker-create">
                <label>
                  <span>{prefix.length > 0 ? "Nova subcategoria" : "Nova categoria"}</span>
                  <input
                    autoFocus
                    value={newName}
                    placeholder="Ex: Consultoria"
                    onChange={(event) => setNewName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleCreateCategory();
                    }}
                  />
                </label>
                {createError ? <small>{createError}</small> : null}
                <button type="button" disabled={savingNew} onClick={handleCreateCategory}>
                  {savingNew ? "Criando..." : "Criar e selecionar"}
                </button>
              </div>
            ) : null}

            <div className="category-picker-list">
              {visibleOptions.map((option) => {
                const child = hasChildren(option.parts);
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`category-picker-option${isSelected ? " is-selected" : ""}`}
                    onClick={() => {
                      if (child) {
                        setPrefix(option.parts);
                        return;
                      }

                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="category-picker-option-main">
                      <strong>{option.parts.at(-1) ?? option.value}</strong>
                      {child ? <small>Toque para ver subcategorias</small> : null}
                    </span>
                    <span className="category-picker-level">Nivel {option.parts.length || 1}</span>
                    {child ? (
                      <span className="category-picker-chevron" aria-hidden="true">
                        {">"}
                      </span>
                    ) : (
                      <span className="category-picker-radio" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="finance-field">
      <span>{label}</span>
      <button className="category-picker-trigger" type="button" onClick={openPicker}>
        <span>
          <strong>{selectedParts.at(-1) ?? value}</strong>
          {selectedParts.length > 1 ? <small>{selectedParts.slice(0, -1).join(" > ")}</small> : null}
        </span>
        <i aria-hidden="true">v</i>
      </button>
      {picker}
    </div>
  );
}
