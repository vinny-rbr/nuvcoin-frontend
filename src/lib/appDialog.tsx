import ReactDOM from "react-dom/client";
import { useEffect, useState } from "react";
import "../components/app-dialog.css";

type DialogKind = "alert" | "confirm";

type DialogRequest = {
  id: number;
  kind: DialogKind;
  message: string;
  resolve: (value: boolean) => void;
};

let root: ReactDOM.Root | null = null;
let pushDialog: ((dialog: DialogRequest) => void) | null = null;
let nextDialogId = 1;
let installed = false;

function AppDialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  useEffect(() => {
    pushDialog = setDialog;

    return () => {
      pushDialog = null;
    };
  }, []);

  if (!dialog) return null;

  function close(value: boolean) {
    dialog?.resolve(value);
    setDialog(null);
  }

  return (
    <div className="app-dialog-backdrop" role="presentation">
      <div className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title">
        <div className="app-dialog-mark" aria-hidden="true" />
        <h2 id="app-dialog-title" className="app-dialog-title">
          Conciliaaí
        </h2>
        <p className="app-dialog-message">{dialog.message}</p>
        <div className="app-dialog-actions">
          {dialog.kind === "confirm" && (
            <button className="app-dialog-button app-dialog-button-ghost" type="button" onClick={() => close(false)}>
              Cancelar
            </button>
          )}
          <button className="app-dialog-button app-dialog-button-primary" type="button" onClick={() => close(true)}>
            {dialog.kind === "confirm" ? "Confirmar" : "Ok"}
          </button>
        </div>
      </div>
    </div>
  );
}

function showDialog(kind: DialogKind, message: string): Promise<boolean> {
  ensureAppDialog();

  return new Promise((resolve) => {
    pushDialog?.({
      id: nextDialogId++,
      kind,
      message,
      resolve,
    });
  });
}

export function ensureAppDialog(): void {
  if (typeof window === "undefined") return;
  if (!root) {
    const host = document.createElement("div");
    host.id = "conciliaai-dialog-root";
    document.body.appendChild(host);
    root = ReactDOM.createRoot(host);
    root.render(<AppDialogHost />);
  }

  if (installed) return;
  installed = true;

  window.alert = (message?: unknown) => {
    void showDialog("alert", String(message ?? ""));
  };

  window.confirm = (message?: unknown) => {
    void showDialog("confirm", String(message ?? ""));
    return true;
  };
}

export async function appAlert(message: string): Promise<void> {
  await showDialog("alert", message);
}

export async function appConfirm(message: string): Promise<boolean> {
  return showDialog("confirm", message);
}
