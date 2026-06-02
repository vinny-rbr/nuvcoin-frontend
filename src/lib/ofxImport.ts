import type { FinanceItem, PaymentType } from "../types/finance";
import { makeId } from "./financeService";

export type OfxParsedItem = {
  id: string;
  type: FinanceItem["type"];
  title: string;
  amountCents: number;
  dateISO: string;
  fitId?: string;
};

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function readTag(block: string, tag: string): string {
  const closedMatch = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (closedMatch?.[1]) return stripTags(closedMatch[1]);

  const openMatch = block.match(new RegExp(`<${tag}[^>]*>([^\\r\\n<]+)`, "i"));
  return stripTags(openMatch?.[1] ?? "");
}

function parseOfxDate(value: string): string {
  const compact = value.replace(/[^\d]/g, "");
  const year = compact.slice(0, 4);
  const month = compact.slice(4, 6);
  const day = compact.slice(6, 8);

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function parseAmountCents(value: string): number {
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(Math.abs(amount) * 100);
}

function inferType(block: string, amountRaw: string): FinanceItem["type"] {
  const typeRaw = readTag(block, "TRNTYPE").toUpperCase();
  const amount = Number(amountRaw.replace(",", ".").replace(/[^\d.-]/g, ""));

  if (Number.isFinite(amount) && amount > 0) return "RECEITA";
  if (["CREDIT", "DEP", "INT", "DIV"].includes(typeRaw)) return "RECEITA";
  return "DESPESA";
}

export function parseOfx(text: string): OfxParsedItem[] {
  const blocks = text.match(/<STMTTRN\b[^>]*>[\s\S]*?(?=<STMTTRN\b|<\/BANKTRANLIST>|<\/OFX>|$)/gi) ?? [];

  return blocks
    .map((block) => {
      const amountRaw = readTag(block, "TRNAMT");
      const amountCents = parseAmountCents(amountRaw);
      const title =
        readTag(block, "MEMO") ||
        readTag(block, "NAME") ||
        readTag(block, "CHECKNUM") ||
        "Lancamento importado";

      return {
        id: readTag(block, "FITID") || makeId(),
        fitId: readTag(block, "FITID") || undefined,
        type: inferType(block, amountRaw),
        title,
        amountCents,
        dateISO: parseOfxDate(readTag(block, "DTPOSTED") || readTag(block, "DTUSER")),
      };
    })
    .filter((item) => item.amountCents > 0 && Boolean(item.title.trim()));
}

export function toFinanceItem(
  item: OfxParsedItem,
  categories: { income: string; expense: string },
  paymentType: PaymentType = "debit",
): FinanceItem {
  return {
    id: makeId(),
    type: item.type,
    title: item.title,
    category: item.type === "RECEITA" ? categories.income : categories.expense,
    amountCents: item.amountCents,
    dateISO: item.dateISO,
    createdAtISO: new Date().toISOString(),
    paymentType,
    status: "paid",
  };
}
