export function getTokenFromStorage(): string | null {
  const candidates = ["token", "accessToken", "jwt", "authToken"]; // Possíveis chaves

  for (const key of candidates) {
    const value = localStorage.getItem(key); // Lê o valor
    if (value && value.trim().length > 0) return value; // Retorna se tiver
  }

  return null; // Não achou token
}

export function getAuthTokenOrThrow(): string {
  const t = getTokenFromStorage(); // Lê do localStorage na hora (sempre atualizado)
  if (!t) throw new Error("Token não encontrado no localStorage. Faça login novamente."); // Sem token
  return t; // OK
}

export function formatBRLFromCents(valueCents: number): string {
  const value = (valueCents ?? 0) / 100; // Centavos -> reais
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // BRL
}

export function formatBRL(value: number): string {
  const v = Number.isFinite(value) ? value : 0; // Segurança
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // BRL
}

export function toCentsFromBRLInput(value: string): number {
  const clean = (value ?? "")
    .replace(/[R$\s]/g, "") // Remove R$ e espaços
    .replace(/\./g, "") // Remove separador milhar
    .replace(",", "."); // Troca vírgula por ponto

  const number = Number(clean); // Converte
  if (!Number.isFinite(number) || number <= 0) return 0; // inválido
  return Math.round(number * 100); // Reais -> centavos
}

export function toIsoForBackend(dateYYYYMMDD: string): string {
  if (!dateYYYYMMDD) return ""; // Se vier vazio, retorna vazio
  return `${dateYYYYMMDD}T00:00:00.000Z`; // ISO meia-noite UTC
}

export function monthLabelBR(dateYYYYMMDD: string): string {
  const d = new Date(`${dateYYYYMMDD}T00:00:00.000Z`); // Data
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); // Mês/Ano
}

export function isGuid(value: string): boolean {
  const v = (value ?? "").trim(); // Trim
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v); // Regex GUID
}

export function shortGuid(value: string): string {
  const v = (value ?? "").trim(); // Trim
  if (v.length < 8) return v; // Curto
  return `${v.slice(0, 8)}…`; // Exibe curto
}

export function safeName(name?: string | null, email?: string | null, userId?: string | null): string {
  const n = (name ?? "").trim(); // Nome
  if (n) return n; // Se tiver nome, usa

  const e = (email ?? "").trim(); // Email
  if (e) return e; // Se tiver email, usa

  return shortGuid(userId ?? ""); // Fallback: Guid curto
}

export function monthKeyFromISO(iso: string): string {
  const d = new Date(iso); // Data
  const y = d.getUTCFullYear(); // Ano UTC
  const m = String(d.getUTCMonth() + 1).padStart(2, "0"); // Mês UTC
  return `${y}-${m}`; // YYYY-MM
}

export function currentMonthKeyUTC(): string {
  const now = new Date(); // Agora
  const y = now.getUTCFullYear(); // Ano UTC
  const m = String(now.getUTCMonth() + 1).padStart(2, "0"); // Mês UTC
  return `${y}-${m}`; // YYYY-MM
}

export function isoToDateInput(iso: string): string {
  if (!iso) return ""; // Vazio

  const d = new Date(iso); // Data
  const y = d.getUTCFullYear(); // Ano
  const m = String(d.getUTCMonth() + 1).padStart(2, "0"); // Mês
  const day = String(d.getUTCDate()).padStart(2, "0"); // Dia

  return `${y}-${m}-${day}`; // YYYY-MM-DD
}

export function centsToBRLInput(amountCents: number): string {
  const value = (amountCents ?? 0) / 100; // Centavos -> reais
  const s = value.toFixed(2); // 2 casas
  return s.replace(".", ","); // vírgula
}

export function normalizePercentInputText(value: string): string {
  return (value ?? "")
    .replace(/[^\d,.\-]/g, "") // Mantém só números e separadores
    .replace(/\./g, ","); // Padroniza visual com vírgula
}

export function percentTextToNumber(value: string): number {
  const normalized = (value ?? "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", "."); // Normaliza

  const parsed = Number(normalized); // Converte
  if (!Number.isFinite(parsed) || parsed < 0) return 0; // Segurança

  return parsed; // Retorna número
}

export function percentNumberToInput(value: number): string {
  const safe = Number.isFinite(value) && value >= 0 ? value : 0; // Segurança
  return safe.toFixed(2).replace(".", ","); // Ex: 60,00
}

export function getInitials(label: string): string {
  const parts = (label ?? "").trim().split(/\s+/).filter(Boolean); // Quebra nome

  if (parts.length === 0) return "??"; // Fallback
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase(); // 1 palavra

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase(); // 2 iniciais
}