import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type CategoryPickerProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function splitCategoryPath(value: string): string[] {
  return value
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function CategoryPicker({ label, value, options, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedParts = useMemo(() => splitCategoryPath(value), [value]);

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
                <span>Organizacao</span>
                <strong>Escolha a categoria</strong>
              </div>
              <button type="button" aria-label="Fechar categorias" onClick={() => setOpen(false)}>
                x
              </button>
            </div>

            <div className="category-picker-list">
              {options.map((option) => {
                const parts = splitCategoryPath(option);
                const isSelected = option === value;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`category-picker-option${isSelected ? " is-selected" : ""}`}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                  >
                    <span className="category-picker-option-main">
                      <strong>{parts.at(-1) ?? option}</strong>
                      {parts.length > 1 ? <small>{parts.slice(0, -1).join(" > ")}</small> : null}
                    </span>
                    <span className="category-picker-level">Nivel {parts.length || 1}</span>
                    <span className="category-picker-radio" aria-hidden="true" />
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
      <button className="category-picker-trigger" type="button" onClick={() => setOpen(true)}>
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
