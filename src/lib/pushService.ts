import { apiUrl } from "./api";

export type NotifSound = {
  id: string;
  label: string;
  file: string;
};

export const NOTIF_SOUNDS: NotifSound[] = [
  { id: "notification-bell", label: "Notification Bell", file: "/sounds/notification-bell.mp3" },
  { id: "premium",           label: "Premium",           file: "/sounds/premium.mp3" },
  { id: "twinkle",           label: "Twinkle",           file: "/sounds/twinkle.mp3" },
  { id: "welcome-chime",     label: "Welcome Chime",     file: "/sounds/welcome-chime.mp3" },
  { id: "threads",           label: "Threads",           file: "/sounds/threads.mp3" },
  { id: "blackberry",        label: "Blackberry",        file: "/sounds/blackberry.mp3" },
  { id: "wink",              label: "Wink",              file: "/sounds/wink.mp3" },
  { id: "bottle-cap",        label: "Bottle Cap",        file: "/sounds/bottle-cap.mp3" },
  { id: "beeper-rush",       label: "Beeper Rush",       file: "/sounds/beeper-rush.mp3" },
  { id: "blare",             label: "Blare",             file: "/sounds/blare.mp3" },
  { id: "crosswalk",         label: "Crosswalk",         file: "/sounds/crosswalk.mp3" },
  { id: "tlan-tlan",         label: "Tlan Tlan",         file: "/sounds/tlan-tlan.mp3" },
];

const KEY_SOUND   = "conciliaai_notif_sound";
const KEY_VIBRATE = "conciliaai_notif_vibrate";
const KEY_ENABLED = "conciliaai_notif_enabled";

export function getNotifSound(): string {
  return localStorage.getItem(KEY_SOUND) ?? "notification-bell";
}
export function setNotifSound(id: string): void {
  localStorage.setItem(KEY_SOUND, id);
}
export function getNotifVibrate(): boolean {
  return localStorage.getItem(KEY_VIBRATE) !== "false";
}
export function setNotifVibrate(v: boolean): void {
  localStorage.setItem(KEY_VIBRATE, String(v));
}
export function getNotifEnabled(): boolean {
  return localStorage.getItem(KEY_ENABLED) === "true";
}
export function setNotifEnabled(v: boolean): void {
  localStorage.setItem(KEY_ENABLED, String(v));
}

export function playSound(soundId?: string): void {
  const id = soundId ?? getNotifSound();
  const sound = NOTIF_SOUNDS.find((s) => s.id === id) ?? NOTIF_SOUNDS[0];
  const audio = new Audio(sound.file);
  audio.volume = 0.8;
  void audio.play().catch(() => undefined);
}

export function vibrateDevice(): void {
  if (getNotifVibrate() && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}

// ── Push subscription ──────────────────────────────────────────────────────

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

async function fetchVapidPublicKey(): Promise<string> {
  // sempre busca do backend (não usa cache) para garantir chave atual
  localStorage.removeItem("conciliaai_vapid_public");
  const res = await fetch(apiUrl("/api/push/vapid-public-key"));
  if (!res.ok) throw new Error(`Falha ao buscar VAPID key: HTTP ${res.status}`);
  const data = (await res.json()) as { publicKey?: string };
  if (!data.publicKey) throw new Error("Backend não retornou VAPID public key");
  localStorage.setItem("conciliaai_vapid_public", data.publicKey);
  return data.publicKey;
}

// Lança erro em vez de retornar false, para o chamador poder mostrar o motivo
export async function subscribePush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push não suportado neste navegador");
  }
  const permission = await requestPushPermission();
  if (permission !== "granted") {
    throw new Error(`Permissão de notificação: ${permission}`);
  }

  const vapidKey = await fetchVapidPublicKey();

  const reg = await navigator.serviceWorker.ready;

  // descarta subscription antiga (pode ter sido criada sem VAPID key)
  const existing = await reg.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const token = localStorage.getItem("token");
  if (token) {
    const saveRes = await fetch(apiUrl("/api/push/subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        sound: getNotifSound(),
        vibrate: getNotifVibrate(),
      }),
    });
    if (!saveRes.ok) throw new Error(`Falha ao salvar subscription no servidor: HTTP ${saveRes.status}`);
  }

  setNotifEnabled(true);
  return true;
}

export async function unsubscribePush(): Promise<void> {
  setNotifEnabled(false);
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      const token = localStorage.getItem("token");
      if (token) {
        // apiUrl imported at top of file
        await fetch(apiUrl("/api/push/subscribe"), {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
      }
    }
  } catch {
    // ignore
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  return arr.buffer as ArrayBuffer;
}
