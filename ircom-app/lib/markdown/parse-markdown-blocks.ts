export type MarkdownBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "callout"; label: string; text: string }
  | { type: "pullquote"; text: string }
  | { type: "concept"; number: string; title: string; description: string };

const CALLOUT_PREFIXES = [
  "Anti-patterns",
  "Anti-patterns :",
  "Pont vers l'Atelier",
  "Pont vers l'Atelier :",
  "Bridge to Workshop",
  "Bridge to Workshop:",
] as const;

const CONCEPT_LINE =
  /^\*\*(\d+)\.\s([^*]+)\*\*\s*[—–-]\s*(.+)$/u;
const PULLQUOTE_LINE = /^\*(.+)\*$/u;
const ORDERED_LINE = /^(\d+)\.\s+(.*)$/;
const TABLE_ROW = /^\|/;

function isTableSeparator(cells: string[]): boolean {
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
}

function splitEmbeddedTableLine(line: string): string[] {
  const tableStart = line.search(/\s\|[^|]+\|/);
  if (tableStart === -1) {
    return [line];
  }

  const prose = line.slice(0, tableStart).trim();
  const tablePart = line.slice(tableStart).trim();
  const rows: string[] = [];
  let remaining = tablePart;

  while (remaining.length > 0) {
    const rowMatch = remaining.match(/^\|[^|]*(?:\|[^|]*)+\|/);
    if (!rowMatch) {
      break;
    }
    rows.push(rowMatch[0]);
    remaining = remaining.slice(rowMatch[0].length).trim();
  }

  const trailing = remaining.trim();
  const result: string[] = [];
  if (prose.length > 0) {
    result.push(prose);
  }
  result.push(...rows);
  if (trailing.length > 0) {
    result.push(trailing);
  }
  return result;
}

function parseCallout(line: string): { label: string; text: string } | null {
  for (const prefix of CALLOUT_PREFIXES) {
    const pattern = new RegExp(`^\\*\\*${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\*\\*\\s*(.*)$`, "u");
    const match = line.match(pattern);
    if (match) {
      return { label: prefix.replace(/:$/, "").replace(/ :$/, ""), text: match[1]?.trim() ?? "" };
    }
  }
  return null;
}

function pushListBlock(blocks: MarkdownBlock[], listType: "ul" | "ol", items: string[]): void {
  if (items.length === 0) {
    return;
  }
  blocks.push({ type: listType, items: [...items] });
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const expandedLines = markdown
    .split("\n")
    .flatMap((line) => (line.includes("|") && !line.startsWith("|") ? splitEmbeddedTableLine(line) : [line]));

  const blocks: MarkdownBlock[] = [];
  let bulletItems: string[] = [];
  let orderedItems: string[] = [];
  let tableRows: string[][] = [];

  const flushLists = () => {
    pushListBlock(blocks, "ul", bulletItems);
    bulletItems = [];
    pushListBlock(blocks, "ol", orderedItems);
    orderedItems = [];
  };

  const flushTable = () => {
    if (tableRows.length === 0) {
      return;
    }
    blocks.push({ type: "table", rows: [...tableRows] });
    tableRows = [];
  };

  for (const rawLine of expandedLines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("|")) {
      flushLists();
      const cells = parseTableRow(line);
      if (!isTableSeparator(cells)) {
        tableRows.push(cells);
      }
      continue;
    }

    flushTable();

    if (line.startsWith("### ")) {
      flushLists();
      blocks.push({ type: "heading", level: 4, text: line.slice(4) });
      continue;
    }

    if (line.startsWith("## ")) {
      flushLists();
      blocks.push({ type: "heading", level: 3, text: line.slice(3) });
      continue;
    }

    if (line.startsWith("# ")) {
      flushLists();
      blocks.push({ type: "heading", level: 2, text: line.slice(2) });
      continue;
    }

    if (line.trim().length === 0) {
      flushLists();
      continue;
    }

    if (line.startsWith("> ")) {
      flushLists();
      blocks.push({ type: "blockquote", text: line.slice(2) });
      continue;
    }

    const conceptMatch = line.match(CONCEPT_LINE);
    if (conceptMatch) {
      flushLists();
      blocks.push({
        type: "concept",
        number: conceptMatch[1] ?? "",
        title: conceptMatch[2]?.trim() ?? "",
        description: conceptMatch[3]?.trim() ?? "",
      });
      continue;
    }

    const pullquoteMatch = line.match(PULLQUOTE_LINE);
    if (pullquoteMatch && line.startsWith("*") && !line.startsWith("**")) {
      flushLists();
      blocks.push({ type: "pullquote", text: pullquoteMatch[1]?.trim() ?? "" });
      continue;
    }

    const callout = parseCallout(line);
    if (callout) {
      flushLists();
      blocks.push({ type: "callout", label: callout.label, text: callout.text });
      continue;
    }

    const orderedMatch = line.match(ORDERED_LINE);
    if (orderedMatch && !line.startsWith("**")) {
      orderedItems.push(orderedMatch[2]?.trim() ?? "");
      continue;
    }

    if (line.startsWith("- ")) {
      bulletItems.push(line.slice(2));
      continue;
    }

    flushLists();
    blocks.push({ type: "paragraph", text: line });
  }

  flushLists();
  flushTable();
  return blocks;
}
