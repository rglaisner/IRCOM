import type { ReactNode } from "react";

interface MarkdownContentProps {
  markdown: string;
  className?: string;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function MarkdownContent({ markdown, className = "" }: MarkdownContentProps) {
  const lines = markdown.split("\n");
  const nodes: ReactNode[] = [];
  let tableRows: string[][] = [];
  let index = 0;

  const flushTable = () => {
    if (tableRows.length === 0) {
      return;
    }
    const [header, , ...body] = tableRows;
    nodes.push(
      <div key={`table-${index}`} className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {header.map((cell) => (
                <th
                  key={cell}
                  className="border border-[var(--ircom-border)] bg-[var(--ircom-panel-subtle)] px-3 py-2 text-left font-medium"
                >
                  {renderInline(cell.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell) => (
                  <td
                    key={cell}
                    className="border border-[var(--ircom-border)] px-3 py-2 align-top"
                  >
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    index += 1;
    tableRows = [];
  };

  for (const line of lines) {
    if (line.startsWith("|")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
      if (!cells.every((cell) => /^-+$/.test(cell))) {
        tableRows.push(cells);
      }
      continue;
    }

    flushTable();

    if (line.startsWith("### ")) {
      nodes.push(
        <h4 key={`h4-${index}`} className="ircom-heading mt-4 text-base font-semibold">
          {line.slice(4)}
        </h4>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h3 key={`h-${index}`} className="ircom-heading mt-6 text-lg font-semibold">
          {line.slice(3)}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      nodes.push(
        <h2 key={`h-${index}`} className="ircom-heading mt-4 text-xl font-semibold">
          {line.slice(2)}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (line.trim().length === 0) {
      continue;
    }

    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={`bq-${index}`}
          className="border-l-4 border-[var(--ircom-blue)] bg-[var(--ircom-panel-subtle)] px-4 py-2 text-sm leading-relaxed"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      );
      index += 1;
      continue;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      nodes.push(
        <li
          key={`ol-${index}`}
          className="ircom-body ml-4 list-decimal text-sm leading-relaxed"
          value={Number(numberedMatch[1])}
        >
          {renderInline(numberedMatch[2])}
        </li>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      nodes.push(
        <li key={`li-${index}`} className="ircom-body ml-4 list-disc text-sm leading-relaxed">
          {renderInline(line.slice(2))}
        </li>,
      );
      index += 1;
      continue;
    }

    nodes.push(
      <p key={`p-${index}`} className="ircom-body text-sm leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    index += 1;
  }

  flushTable();

  return <div className={`space-y-3 ${className}`}>{nodes}</div>;
}
