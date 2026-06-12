import type { FinanceItem, PaymentType } from "../types/finance";
import { makeId } from "./financeService";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfjsWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export type OfxParsedItem = {
  id: string;
  type: FinanceItem["type"];
  title: string;
  amountCents: number;
  dateISO: string;
  fitId?: string;
};

export type BankFileKind = "OFX" | "CSV" | "XLSX" | "PDF";

export type PdfProgress = {
  phase: "loading" | "ocr";
  page: number;
  totalPages: number;
  percent: number;
};

export type LedgerBal = {
  balanceCents: number;
  dateISO: string;
};

type ParsedRow = Record<string, string | number | undefined>;
type RawSheetCell = string | number | Date | undefined;
type CategoryInput = string | string[];

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

const categoryRules: Record<FinanceItem["type"], Array<{ categoryHints: string[]; keywords: RegExp[] }>> = {
  RECEITA: [
    {
      categoryHints: ["salario", "pro labore", "folha"],
      keywords: [/\bsalario\b/, /\bpro labore\b/, /\bordenado\b/, /\bpagamento.*salario\b/],
    },
    {
      categoryHints: ["vendas", "venda", "recebimento"],
      keywords: [/\bvenda\b/, /\bvendas\b/, /\bmaquininha\b/, /\bcartao recebido\b/, /\brecebimento\b/],
    },
    {
      categoryHints: ["freelance", "servico", "consultoria"],
      keywords: [/\bfreela\b/, /\bfreelance\b/, /\bservico\b/, /\bconsultoria\b/, /\bprojeto\b/],
    },
  ],
  DESPESA: [
    {
      categoryHints: ["viagem", "transporte", "corrida"],
      keywords: [/\buber\b/, /\b99\b/, /\btaxi\b/, /\bcorrida\b/, /\bpassagem\b/, /\bviagem\b/, /\btransporte\b/],
    },
    {
      categoryHints: ["alimentacao", "alimentos", "mercado", "comida"],
      keywords: [
        /\bmercado\b/,
        /\bsupermercado\b/,
        /\bsup\b/,
        /\brestaurante\b/,
        /\bifood\b/,
        /\blanche\b/,
        /\bpadaria\b/,
        /\bpizzaria\b/,
        /\bburger\b/,
        /\bhamburguer\b/,
        /\balimentacao\b/,
        /\bcomida\b/,
      ],
    },
    {
      categoryHints: ["moradia", "casa", "aluguel"],
      keywords: [/\baluguel\b/, /\bcondominio\b/, /\benergia\b/, /\bluz\b/, /\bagua\b/, /\binternet\b/, /\bmoradia\b/],
    },
    {
      categoryHints: ["saude", "farmacia", "drogaria"],
      keywords: [/\bfarmacia\b/, /\bdrogaria\b/, /\bhospital\b/, /\bclinica\b/, /\bmedico\b/, /\bsaude\b/],
    },
    {
      categoryHints: ["lazer", "assinatura", "streaming"],
      keywords: [/\bnetflix\b/, /\bspotify\b/, /\bcinema\b/, /\blazer\b/, /\bshow\b/, /\bassinatura\b/],
    },
    {
      categoryHints: ["educacao", "curso", "estudo"],
      keywords: [/\bescola\b/, /\bfaculdade\b/, /\bcurso\b/, /\beducacao\b/, /\bestudo\b/],
    },
  ],
};

function asCategoryList(input: CategoryInput): string[] {
  return Array.isArray(input) ? input.filter(Boolean) : [input].filter(Boolean);
}

function leafCategoryName(category: string): string {
  return category.split(">").at(-1)?.trim() || category;
}

function findBestCategory(type: FinanceItem["type"], title: string, categories: string[], fallback: string): string {
  const normalizedTitle = normalizeText(title);
  const rules = categoryRules[type] ?? [];

  for (const rule of rules) {
    if (!rule.keywords.some((keyword) => keyword.test(normalizedTitle))) continue;

    const directMatch = categories.find((category) => {
      const normalizedLeaf = normalizeText(leafCategoryName(category));
      const normalizedFull = normalizeText(category);
      return rule.categoryHints.some((hint) => normalizedLeaf.includes(hint) || normalizedFull.includes(hint));
    });

    if (directMatch) return directMatch;
  }

  return fallback;
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

export function parseOfx(text: string): { items: OfxParsedItem[]; ledgerBal: LedgerBal | null } {
  const blocks = text.match(/<STMTTRN\b[^>]*>[\s\S]*?(?=<STMTTRN\b|<\/BANKTRANLIST>|<\/OFX>|$)/gi) ?? [];

  const items = blocks
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

  // Extract LEDGERBAL (closing balance reported by the bank)
  const balAmtRaw = text.match(/<LEDGERBAL[\s\S]*?<BALAMT>([^\r\n<]+)/i)?.[1]?.trim();
  const balDateRaw = text.match(/<LEDGERBAL[\s\S]*?<DTASOF>([^\r\n<]+)/i)?.[1]?.trim();
  let ledgerBal: LedgerBal | null = null;
  if (balAmtRaw && balDateRaw) {
    const balanceCents = Math.round(Number(balAmtRaw.replace(",", ".").replace(/[^\d.-]/g, "")) * 100);
    const dateISO = parseOfxDate(balDateRaw);
    if (Number.isFinite(balanceCents) && dateISO) {
      ledgerBal = { balanceCents, dateISO };
    }
  }

  return { items, ledgerBal };
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
      const descriptionIndex = columnIndex(normalizedHeaders, [
        /descricao/,
        /historico/,
        /lancamento/,
        /memo/,
        /nome/,
        /title/,
        /transaction.*type/,
        /^type$/,
        /^tipo$/,
      ]);
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

function scoreHeader(headers: string[]): number {
  const normalizedHeaders = headers.map(normalizeText);
  const hasDate = columnIndex(normalizedHeaders, [/^data/, /date/]) >= 0;
  const hasDescription = columnIndex(normalizedHeaders, [
    /descricao/,
    /historico/,
    /lancamento/,
    /memo/,
    /nome/,
    /title/,
    /transaction.*type/,
    /^type$/,
    /^tipo$/,
  ]) >= 0;
  const hasAmount = columnIndex(normalizedHeaders, [/^valor$/, /amount/, /total/, /debito/, /credito/, /entrada/, /saida/]) >= 0;

  return [hasDate, hasDescription, hasAmount].filter(Boolean).length;
}

function rowsArrayToParsedItems(rawRows: RawSheetCell[][]): OfxParsedItem[] {
  const headerIndex = rawRows.findIndex((row) => scoreHeader(row.map((cell) => String(cell ?? ""))) >= 2);
  if (headerIndex < 0) return [];

  const headers = rawRows[headerIndex].map((cell, index) => String(cell || `coluna_${index + 1}`).trim());
  const rows = rawRows.slice(headerIndex + 1).map((cells) =>
    headers.reduce<ParsedRow>((row, header, index) => {
      const value = cells[index];
      row[header] = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "").trim();
      return row;
    }, {}),
  );

  return rowsToParsedItems(rows);
}

export function parseCsv(text: string): OfxParsedItem[] {
  const separator = detectCsvSeparator(text);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  return rowsArrayToParsedItems(lines.map((line) => splitCsvLine(line, separator)));
}

export async function parseXlsx(file: File): Promise<OfxParsedItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawSheetCell[]>(sheet, { header: 1, defval: "", raw: false });
  return rowsArrayToParsedItems(rows);
}

const DATE_RE = /\d{2}[./-]\d{2}[./-]\d{2,4}/;
const AMOUNT_RE_TEST = /\d+,\d{2}/;

function preJoinPdfLines(raw: string[]): string[] {
  // Fix 1 – OCR column-split: a line has a date but no amount; the next line
  //         carries the amount (Tesseract broke the row at the CPF column).
  //         Join them so the parser sees date + amount together.
  //
  // Fix 2 – Same-timestamp AZCX rows: the PDF prints several maquininha
  //         totals at the exact same HH:MM:SS (e.g. 5 entries at 09:07:10).
  //         Tesseract often fuses them into one super-line. Split on each
  //         internal date occurrence so each sub-entry becomes its own line.
  const joined: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    const hasDate = DATE_RE.test(line);
    const hasAmount = AMOUNT_RE_TEST.test(line);

    // Join orphaned date line with the following amount line
    if (hasDate && !hasAmount && i + 1 < raw.length) {
      joined.push(line + " " + raw[i + 1]);
      i++;
      continue;
    }
    joined.push(line);
  }

  // Split merged lines: if a joined line contains more than one date occurrence
  // (from fused AZCX rows), re-split on each date boundary.
  const split: string[] = [];
  for (const line of joined) {
    const parts = line.split(/(?=\d{2}[./-]\d{2}[./-]\d{4}\s*[-–]\s*\d{2}:\d{2}:\d{2})/);
    for (const part of parts) {
      const p = part.trim();
      if (p) split.push(p);
    }
  }
  return split;
}

function parsePdfLines(text: string): { items: OfxParsedItem[]; ledgerBal: LedgerBal | null } {
  let lastDateISO = "";
  let lastSaldoCents: number | null = null;

  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const items = preJoinPdfLines(rawLines)
    .flatMap((line): OfxParsedItem[] => {
      const dateMatch = line.match(/(\d{2}[./-]\d{2}[./-]\d{2,4})/);
      if (!dateMatch) return [];
      // Skip header/summary lines that contain dates but are not transactions
      if (/saldo anterior|período dos lançamentos|periodo dos lancamentos/i.test(line)) return [];

      // Collect all monetary amounts with optional C/D suffix (Caixa format).
      // Three fallback patterns handle OCR-dropped commas:
      //   \d{1,3}\.\d{3}\d{2}(?=\s*[CD]) — "1.04216C" → "1.042,16" (comma fused with period)
      //   \d{4,8}(?=\s*[CD])              — "19585C"   → "195,85"   (no separator at all)
      const amountRe = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d{1,3}\.\d{5}(?=\s*[CD]\b)|\d{4,8}(?=\s*[CD]\b))\s*([CD]\b)?/g;
      const amounts: Array<{ raw: string; cents: number; suffix?: string }> = [];
      let m: RegExpExecArray | null;
      while ((m = amountRe.exec(line)) !== null) {
        const raw = m[1];
        let cents: number;
        if (raw.includes(",")) {
          cents = Math.round(parseFloat(raw.replace(/\./g, "").replace(",", ".")) * 100);
        } else if (raw.includes(".")) {
          // "1.04216" → OCR dropped comma in "1.042,16" → parse as thousands+cents
          const parts = raw.match(/^(\d{1,3})\.(\d{3})(\d{2})$/);
          cents = parts ? parseInt(parts[1] + parts[2], 10) * 100 + parseInt(parts[3], 10) : Math.round(parseFloat(raw) * 100);
        } else {
          // Pure integer → OCR dropped comma, already in centavos (e.g. 19585 = R$195,85)
          cents = parseInt(raw, 10);
        }
        amounts.push({ raw, cents, suffix: m[2] });
      }
      if (amounts.length === 0) return [];

      // Caixa extrato: last column = Saldo, second-to-last = Valor (transaction)
      const valorEntry = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
      if (valorEntry.cents <= 0) return [];

      // Track the running balance (last amount = saldo) for ledgerBal
      const saldoEntry = amounts[amounts.length - 1];
      const lineDate = parseDateISO(dateMatch[1]);
      if (lineDate >= lastDateISO) {
        lastDateISO = lineDate;
        // Saldo suffix: C = positive balance, D = negative (overdraft)
        lastSaldoCents = saldoEntry.suffix === "D" ? -saldoEntry.cents : saldoEntry.cents;
      }

      let type: FinanceItem["type"];
      if (valorEntry.suffix === "D") {
        type = "DESPESA";
      } else if (valorEntry.suffix === "C") {
        type = "RECEITA";
      } else {
        type = inferTypeFromText(line, parseBrazilianAmount(valorEntry.raw).sign);
      }

      const title =
        line
          .replace(/\d{2}[./-]\d{2}[./-]\d{2,4}(?:\s*[-–]\s*\d{2}:\d{2}:\d{2})?/, "")
          .replace(/\b\d{5,6}\b/, "")
          .replace(/\*+[\d./\-]+\*+/g, "")
          .replace(/\d{1,3}(?:\.\d{3})*,\d{2}\s*[CD]?\b/g, "")
          .replace(/\s+/g, " ")
          .trim() || "Lancamento importado";

      return [
        {
          id: makeId(),
          type,
          title,
          amountCents: valorEntry.cents,
          dateISO: lineDate,
        },
      ];
    });

  const ledgerBal: LedgerBal | null =
    lastSaldoCents !== null && lastDateISO
      ? { balanceCents: lastSaldoCents, dateISO: lastDateISO }
      : null;

  return { items, ledgerBal };
}

async function decompressDeflate(bytes: BufferSource): Promise<Uint8Array | null> {
  for (const fmt of ["deflate", "deflate-raw"] as CompressionFormat[]) {
    try {
      const ds = new DecompressionStream(fmt);
      const wr = ds.writable.getWriter();
      const rd = ds.readable.getReader();

      // Write and read concurrently — writing alone can deadlock if the
      // internal buffer fills up before anyone drains the readable side.
      const writePromise = wr.write(bytes).then(() => wr.close()).catch(() => {});
      const parts: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        if (value) parts.push(value);
      }
      await writePromise;

      const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
      let off = 0;
      for (const p of parts) { out.set(p, off); off += p.length; }
      return out;
    } catch { /* try next format */ }
  }
  return null;
}

function decodePdfLiteralString(raw: string): string {
  return raw
    .replace(/\\([0-7]{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\n/g, " ")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\(.)/g, "$1");
}

function extractLinesFromStream(text: string): string[] {
  const lines: string[] = [];
  const blocks = text.match(/BT[\s\S]*?ET/g) ?? [];
  for (const block of blocks) {
    const parts: string[] = [];
    const re = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj?|\[([\s\S]*?)\]\s*TJ|<([0-9a-fA-F\s]*)>\s*Tj?/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      if (m[1] !== undefined) {
        parts.push(decodePdfLiteralString(m[1]));
      } else if (m[2] !== undefined) {
        const inner = m[2].match(/\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9a-fA-F\s]*)>/g) ?? [];
        for (const p of inner) {
          if (p.startsWith("(")) {
            parts.push(decodePdfLiteralString(p.slice(1, -1)));
          } else {
            const hex = p.slice(1, -1).replace(/\s/g, "");
            let s = "";
            for (let i = 0; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
            parts.push(s);
          }
        }
      } else if (m[3] !== undefined) {
        const hex = m[3].replace(/\s/g, "");
        let s = "";
        for (let i = 0; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
        parts.push(s);
      }
    }
    const line = parts.join("").replace(/\s+/g, " ").trim();
    if (line) lines.push(line);
  }
  return lines;
}

async function parsePdfViaRaw(data: ArrayBuffer): Promise<{ items: OfxParsedItem[]; ledgerBal: LedgerBal | null }> {
  const allBytes = new Uint8Array(data);
  const allLines: string[] = [];
  let pos = 0;
  let streamsProcessed = 0;

  while (pos < allBytes.length - 8) {
    if (allBytes[pos] !== 0x73) { pos++; continue; }
    if (allBytes[pos+1] !== 0x74 || allBytes[pos+2] !== 0x72 ||
        allBytes[pos+3] !== 0x65 || allBytes[pos+4] !== 0x61 || allBytes[pos+5] !== 0x6D) {
      pos++; continue;
    }
    let dataStart = pos + 6;
    if (allBytes[dataStart] === 0x0D) dataStart++;
    if (allBytes[dataStart] !== 0x0A) { pos++; continue; }
    dataStart++;

    const lookback = new TextDecoder("latin1").decode(allBytes.subarray(Math.max(0, pos - 3000), pos));
    const lengthMatches = [...lookback.matchAll(/\/Length\s+(\d+)/g)];
    const lastLen = lengthMatches.at(-1);
    if (!lastLen) { pos++; continue; }
    const length = parseInt(lastLen[1]);
    if (!length || length < 10 || length > 8_000_000) { pos++; continue; }
    const dataEnd = dataStart + length;
    if (dataEnd > allBytes.length) { pos++; continue; }

    const decompressed = await decompressDeflate(new Uint8Array(allBytes.buffer, dataStart, dataEnd - dataStart));
    if (decompressed) {
      allLines.push(...extractLinesFromStream(new TextDecoder("latin1").decode(decompressed)));
    }

    pos = dataEnd;
    streamsProcessed++;
    if (streamsProcessed % 10 === 0) await new Promise((r) => setTimeout(r, 0));
    if (allLines.length > 200) break;
  }

  return parsePdfLines(allLines.join("\n"));
}

async function parsePdfWithOCR(
  pdf: pdfjsLib.PDFDocumentProxy,
  onProgress?: (p: PdfProgress) => void,
): Promise<{ items: OfxParsedItem[]; ledgerBal: LedgerBal | null }> {
  const totalPages = pdf.numPages;
  onProgress?.({ phase: "loading", page: 0, totalPages, percent: 0 });

  // Dynamic import — Tesseract (~12MB) only loads when actually needed
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        console.log(`[OCR] ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  const allLines: string[] = [];
  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.({
        phase: "ocr",
        page: pageNum,
        totalPages,
        percent: Math.round(((pageNum - 1) / totalPages) * 100),
      });

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx as any, viewport } as any).promise;
      const { data: { text } } = await worker.recognize(canvas);
      allLines.push(...text.split("\n").filter((l) => l.trim()));
      canvas.width = 0; // release memory

      onProgress?.({
        phase: "ocr",
        page: pageNum,
        totalPages,
        percent: Math.round((pageNum / totalPages) * 100),
      });
    }
  } finally {
    await worker.terminate();
  }

  return parsePdfLines(allLines.join("\n"));
}



export async function parsePdf(
  file: File,
  onProgress?: (p: PdfProgress) => void,
): Promise<{ items: OfxParsedItem[]; ledgerBal: LedgerBal | null }> {
  const data = await file.arrayBuffer();
  const dataCopy = data.slice(0); // pdfjs transfers the buffer to its worker
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const allLines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rowMap = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      let key = y;
      for (const k of rowMap.keys()) {
        if (Math.abs(k - y) <= 3) { key = k; break; }
      }
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key)!.push({ x, str: item.str });
    }
    [...rowMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, cells]) => {
        const line = cells.sort((a, b) => a.x - b.x).map((c) => c.str).join(" ");
        if (line.trim()) allLines.push(line);
      });
  }

  if (allLines.length > 0) return parsePdfLines(allLines.join("\n"));

  // Fallback 1: decompress raw PDF streams (works for Form XObjects, custom fonts)
  const rawResult = await parsePdfViaRaw(dataCopy);
  if (rawResult.items.length > 0) return rawResult;

  // Fallback 2: OCR via Tesseract (for image-based PDFs like Caixa)
  return parsePdfWithOCR(pdf, onProgress);
}

export async function parseBankFile(
  file: File,
  options?: { onPdfProgress?: (p: PdfProgress) => void },
): Promise<{ kind: BankFileKind; items: OfxParsedItem[]; ledgerBal?: LedgerBal | null }> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "ofx") {
    const { items, ledgerBal } = parseOfx(await file.text());
    return { kind: "OFX", items, ledgerBal };
  }

  if (extension === "csv") {
    return { kind: "CSV", items: parseCsv(await file.text()) };
  }

  if (extension === "xlsx" || extension === "xls") {
    return { kind: "XLSX", items: await parseXlsx(file) };
  }

  if (extension === "pdf") {
    const { items, ledgerBal } = await parsePdf(file, options?.onPdfProgress);
    return { kind: "PDF", items, ledgerBal };
  }

  throw new Error("Formato nao suportado. Use OFX, CSV, XLSX ou PDF.");
}

export function toFinanceItem(
  item: OfxParsedItem,
  categories: { income: CategoryInput; expense: CategoryInput },
  paymentType: PaymentType = "debit",
): FinanceItem {
  const incomeCategories = asCategoryList(categories.income);
  const expenseCategories = asCategoryList(categories.expense);
  const fallbackCategory =
    item.type === "RECEITA" ? incomeCategories[0] ?? "Outros" : expenseCategories[0] ?? "Outros";
  const category = findBestCategory(
    item.type,
    item.title,
    item.type === "RECEITA" ? incomeCategories : expenseCategories,
    fallbackCategory,
  );

  return {
    id: makeId(),
    type: item.type,
    title: item.title,
    category,
    amountCents: item.amountCents,
    dateISO: item.dateISO,
    createdAtISO: new Date().toISOString(),
    paymentType,
    status: "paid",
  };
}
