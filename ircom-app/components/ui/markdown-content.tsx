import type { ReactNode } from "react";
import { parseMarkdownBlocks, type MarkdownBlock } from "@/lib/markdown/parse-markdown-blocks";

interface MarkdownContentProps {
  markdown: string;
  className?: string;
  variant?: "default" | "course";
}

function renderInline(text: string): ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[var(--ircom-text-heading)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function headingClass(level: 2 | 3 | 4, variant: "default" | "course"): string {
  if (variant === "course") {
    if (level === 2) {
      return "ircom-heading mt-2 text-xl font-semibold tracking-tight";
    }
    if (level === 3) {
      return "ircom-heading mt-8 border-t border-[var(--ircom-border)] pt-6 text-lg font-semibold first:mt-0 first:border-t-0 first:pt-0";
    }
    return "ircom-heading mt-6 text-base font-semibold";
  }

  if (level === 2) {
    return "ircom-heading mt-4 text-xl font-semibold";
  }
  if (level === 3) {
    return "ircom-heading mt-6 text-lg font-semibold";
  }
  return "ircom-heading mt-4 text-base font-semibold";
}

function renderBlock(block: MarkdownBlock, index: number, variant: "default" | "course"): ReactNode {
  const bodyText = variant === "course" ? "ircom-body text-[15px] leading-7" : "ircom-body text-sm leading-relaxed";

  switch (block.type) {
    case "heading":
      if (block.level === 2) {
        return (
          <h2 key={`h2-${index}`} className={headingClass(2, variant)}>
            {renderInline(block.text)}
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3 key={`h3-${index}`} className={headingClass(3, variant)}>
            {renderInline(block.text)}
          </h3>
        );
      }
      return (
        <h4 key={`h4-${index}`} className={headingClass(4, variant)}>
          {renderInline(block.text)}
        </h4>
      );

    case "paragraph": {
      const isLead =
        variant === "course" &&
        block.text.startsWith("**") &&
        block.text.indexOf("**", 2) === block.text.length - 2;

      return (
        <p
          key={`p-${index}`}
          className={
            isLead
              ? "ircom-heading text-lg font-semibold leading-snug text-[var(--ircom-text-heading)]"
              : bodyText
          }
        >
          {renderInline(block.text)}
        </p>
      );
    }

    case "blockquote":
      return (
        <blockquote
          key={`bq-${index}`}
          className="rounded-[var(--ircom-radius-md)] border-l-4 border-[var(--ircom-blue)] bg-[var(--ircom-panel-subtle)] px-4 py-3 text-sm leading-relaxed"
        >
          {renderInline(block.text)}
        </blockquote>
      );

    case "ul":
      return (
        <ul
          key={`ul-${index}`}
          className={`${bodyText} ml-1 list-disc space-y-2 pl-5 marker:text-[var(--ircom-blue)]`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`ul-${index}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol
          key={`ol-${index}`}
          className={`${bodyText} ml-1 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-[var(--ircom-text-heading)]`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`ol-${index}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ol>
      );

    case "table": {
      const [header, , ...body] = block.rows;
      return (
        <div key={`table-${index}`} className="overflow-x-auto rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)]">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr>
                {header.map((cell) => (
                  <th
                    key={cell}
                    className="border-b border-[var(--ircom-border)] bg-[var(--ircom-panel-subtle)] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ircom-text-heading)]"
                  >
                    {renderInline(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row) => (
                <tr key={row.join("-")} className="even:bg-[var(--ircom-panel-subtle)]/40">
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className="border-b border-[var(--ircom-border)] px-3 py-2.5 align-top leading-relaxed last:border-b-0"
                    >
                      {renderInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "concept":
      return (
        <div
          key={`concept-${index}`}
          className="flex gap-3 rounded-[var(--ircom-radius-md)] border border-[var(--ircom-border)] bg-[var(--ircom-panel-subtle)] px-4 py-3"
        >
          <span
            aria-hidden
            className="ircom-heading flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ircom-navy)] text-xs font-bold text-white"
          >
            {block.number}
          </span>
          <p className={`${bodyText} min-w-0`}>
            <strong className="ircom-heading font-semibold">{block.title}</strong>
            <span className="ircom-secondary"> — </span>
            {renderInline(block.description)}
          </p>
        </div>
      );

    case "callout":
      return (
        <div
          key={`callout-${index}`}
          className={`rounded-[var(--ircom-radius-md)] border px-4 py-3 ${
            block.label.includes("Anti")
              ? "border-[#F05872]/30 bg-[#F05872]/5"
              : "border-[var(--ircom-blue)]/30 bg-[var(--ircom-blue)]/5"
          }`}
        >
          <p className="ircom-heading mb-1 text-xs font-semibold uppercase tracking-wide">
            {block.label}
          </p>
          <p className={`${bodyText} mb-0`}>{renderInline(block.text)}</p>
        </div>
      );

    case "pullquote":
      return (
        <figure
          key={`quote-${index}`}
          className="border-l-4 border-[var(--ircom-navy)] py-1 pl-4"
        >
          <blockquote className="ircom-heading text-base font-medium italic leading-relaxed text-[var(--ircom-text-heading)]">
            {renderInline(block.text)}
          </blockquote>
        </figure>
      );

    default:
      return null;
  }
}

export function MarkdownContent({
  markdown,
  className = "",
  variant = "default",
}: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(markdown);
  const containerClass =
    variant === "course"
      ? "max-w-3xl space-y-4"
      : "space-y-3";

  return (
    <div className={`${containerClass} ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index, variant))}
    </div>
  );
}
