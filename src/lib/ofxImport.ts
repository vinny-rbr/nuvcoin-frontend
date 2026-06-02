import type { FinanceItem, PaymentType } from "../types/finance";
import { makeId } from "./financeService";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

export type OfxParsedItem = {
  id: string;
  type: FinanceItem["type"];
  title: string;
  amountCents: number;
  dateISO: string;
  fitId?: string;
};

export type BankFileKind = "OFX" | "CSV" | "XLSX" | "PDF";

type ParsedRow = Record<string, string | number | undefined>;

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

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseBrazilianAmount(rawValue: unknown): { cents: number; sign: number } {
  const raw = String(rawValue ?? "").trim();
  const hasNegativeSignal = /(^-|-\s*$|\(|\bdebito\b|\bdeb\b|\bd\b)/i.test(raw);
  const normalized = raw
    .replace(/\((.*)\)/, "-$1")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = Number(normalized);

  if (!Number.isFinite(value)) return { cents: 0, sign: 1 };

  const sign = value < 0 || hasNegativeSignal ? -1 : 1;
  return { cents: Math.round(Math.abs(value) * 100), sign };
}

function parseDateISO(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  const raw = String(value ?? "").trim();
  const br = raw.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (br) {
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${year}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  }

  const iso = raw.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  return new Date().toISOString().slice(0, 10);
}

function inferTypeFromText(rowText: string, sign: number): FinanceItem["type"] {
  const normalized = normalizeText(rowText);
  if (sign < 0) return "DESPESA";
  if (/\b(credito|credit|entrada|receita|deposito|dep|recebido|pix recebido)\b/.test(normalized)) return "RECEITA";
  if (/\b(debito|debit|saida|despesa|pagamento|compra|tarifa|pix enviado)\b/.test(normalized)) return "DESPESA";
  return "RECEITA";
}

function createParsedItem(input: { title: string; amount: unknown; date: unknown; rowText?: string }): OfxParsedItem | null {
  const amount = parseBrazilianAmount(input.amount);
  if (amount.cents <= 0) return null;

  const title = String(input.title || "Lancamento importado").replace(/\s+/g, " ").trim();

  return {
    id: makeId(),
    type: inferTypeFromText(`${input.rowText ?? ""} ${input.amount}`, amount.sign),
    title,
    amountCents: amount.cents,
    dateISO: parseDateISO(input.date),
  };
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

function splitCsvLine(line: string, separator: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === separator && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function detectCsvSeparator(text: string): string {
  const sample = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const options = [";", ",", "\t"];
  return options.reduce((best, current) => (sample.split(current).length > sample.split(best).length ? current : best), ";");
}

function columnIndex(headers: string[], patterns: RegExp[]): number {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
}

function rowsToParsedItems(rows: ParsedRow[]): OfxParsedItem[] {
  return rows
    .map((row) => {
      const headers = Object.keys(row);
      const normalizedHeaders = headers.map(normalizeText);
      const dateIndex = columnIndex(normalizedHeaders, [/^data/, /date/]);
      const descriptionIndex = columnIndex(normalizedHeaders, [/descricao/, /historico/, /lancamento/, /memo/, /nome/, /title/]);
      const amountIndex = columnIndex(normalizedHeaders, [/^valor$/, /amount/, /total/]);
      const debitIndex = columnIndex(normalizedHeaders, [/debito/, /saida/, /despesa/]);
      const creditIndex = columnIndex(normalizedHeaders, [/credito/, /entrada/, /receita/]);

      const values = headers.map((header) => row[header]);
      const date = dateIndex >= 0 ? values[dateIndex] : values.find((value) => /\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/.test(String(value ?? "")));
      const title = descriptionIndex >= 0 ? values[descriptionIndex] : values.find((value) => !/\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/.test(String(value ?? "")));
      let amount: unknown = amountIndex >= 0 ? values[amountIndex] : undefined;

      if (!amount && debitIndex >= 0 && row[headers[debitIndex]]) amount = `-${row[headers[debitIndex]]}`;
      if (!amount && creditIndex >= 0 && row[headers[creditIndex]]) amount = row[headers[creditIndex]];
      if (!amount) amount = [...values].reverse().find((value) => /\d+[,.]\d{2}/.test(String(value ?? "")));

      return createParsedItem({
        title: String(title ?? "Lancamento importado"),
        amount,
        date,
        rowText: values.join(" "),
      });
    })
    .filter((item): item is OfxParsedItem => Boolean(item));
}

export function parseCsv(text: string): OfxParsedItem[] {
  const separator = detectCsvSeparator(text);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0], separator).map((header, index) => header || `coluna_${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, separator);
    return headers.reduce<ParsedRow>((row, header, index) => {
      row[header] = cells[index];
      return row;
    }, {});
  });

  return rowsToParsedItems(rows);
}

export async function parseXlsx(file: File): Promise<OfxParsedItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "" });
  return rowsToParsedItems(rows);
}

function parsePdfLines(text: string): OfxParsedItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .map((line) => {
      const date = line.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/)?.[0];
      const amountMatches = line.match(/-?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|-?\s*(?:R\$\s*)?\d+,\d{2}/g) ?? [];
      const amount = amountMatches.at(-1);
      if (!date || !amount) return null;

      const title = line.replace(date, "").replace(amount, "").replace(/\b(saldo|total)\b.*$/i, "").trim();
      return createParsedItem({ title, amount, date, rowText: line });
    })
    .filter((item): item is OfxParsedItem => Boolean(item));
}

export async function parsePdf(file: File): Promise<OfxParsedItem[]> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    lines.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }

  return parsePdfLines(lines.join("\n"));
}

export async function parseBankFile(file: File): Promise<{ kind: BankFileKind; items: OfxParsedItem[] }> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "ofx") {
    return { kind: "OFX", items: parseOfx(await file.text()) };
  }

  if (extension === "csv") {
    return { kind: "CSV", items: parseCsv(await file.text()) };
  }

  if (extension === "xlsx" || extension === "xls") {
    return { kind: "XLSX", items: await parseXlsx(file) };
  }

  if (extension === "pdf") {
    return { kind: "PDF", items: await parsePdf(file) };
  }

  throw new Error("Formato nao suportado. Use OFX, CSV, XLSX ou PDF.");
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
