/**
 * One-off helper: split curriculum markdown by bloc headers.
 * Run: npx tsx scripts/ingest-curriculum.ts
 *
 * Outputs section titles to stdout for manual review when extending course.*.json.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "..", "context_content", "Core Course and Atelier Content");

function extractBlocSections(markdown: string, blocNumber: number): string[] {
  const blocPattern = new RegExp(
    `## \\*\\*Bloc ${blocNumber}[^#]*([\\s\\S]*?)(?=## \\*\\*Bloc |## \\*\\*Atelier|## \\*\\*Bloc 4|$)`,
    "i",
  );
  const match = markdown.match(blocPattern);
  if (!match?.[1]) {
    return [];
  }
  const sectionPattern = /### \*\*([^*]+)\*\*/g;
  const titles: string[] = [];
  let sectionMatch = sectionPattern.exec(match[1]);
  while (sectionMatch) {
    titles.push(sectionMatch[1].trim());
    sectionMatch = sectionPattern.exec(match[1]);
  }
  return titles;
}

function main(): void {
  const frPath = join(
    root,
    "Strategic Integration of Generative Artificial Intelligence in Professional Communication_ A Comprehensive Curriculum Framework.md",
  );
  const enPath = join(root, "GenAI IRCOM Curriculum Research and Development.md");
  const frMarkdown = readFileSync(frPath, "utf8");
  const enMarkdown = readFileSync(enPath, "utf8");

  for (const bloc of [1, 2, 3]) {
    console.log(`\nBloc ${bloc} (FR sections):`, extractBlocSections(frMarkdown, bloc));
    console.log(`Bloc ${bloc} (EN sections):`, extractBlocSections(enMarkdown, bloc));
  }
}

main();
