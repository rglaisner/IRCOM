/**
 * Extract philosophy sections from curriculum markdown and merge into course.*.json.
 * Run: npx tsx scripts/ingest-curriculum.ts --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "..", "context_content", "Core Course and Atelier Content");
const contentDir = join(process.cwd(), "content");

const frPath = join(
  root,
  "Strategic Integration of Generative Artificial Intelligence in Professional Communication_ A Comprehensive Curriculum Framework.md",
);
const enPath = join(root, "GenAI IRCOM Curriculum Research and Development.md");

function stripFootnotes(text: string): string {
  return text
    .replace(/\.\d+/g, ".")
    .replace(/\s+\d+(?=[,.;\s])/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractSectionBody(markdown: string, blocNumber: number, sectionKeyword: string): string {
  const blocPattern = new RegExp(
    `## \\*\\*Bloc ${blocNumber}[^#]*([\\s\\S]*?)(?=## \\*\\*Bloc |## \\*\\*Atelier|## \\*\\*Bloc 4|$)`,
    "i",
  );
  const blocMatch = markdown.match(blocPattern);
  if (!blocMatch?.[1]) {
    return "";
  }

  const sectionPattern = new RegExp(
    `### \\*\\*[^*]*${sectionKeyword}[^*]*\\*\\*\\s*([\\s\\S]*?)(?=### \\*\\*|$)`,
    "i",
  );
  const sectionMatch = blocMatch[1].match(sectionPattern);
  return sectionMatch?.[1] ? stripFootnotes(sectionMatch[1].trim()) : "";
}

function extractPhilosophyBody(markdown: string, blocNumber: number): string {
  return extractSectionBody(markdown, blocNumber, "Philosophie");
}

function extractProgramIntro(markdown: string): string {
  const beforeBloc1 = markdown.split(/## \*\*Bloc 1/i)[0] ?? "";
  const paragraphs = beforeBloc1
    .split(/\n\n+/)
    .map((paragraph) => stripFootnotes(paragraph.replace(/^#+\s*/, "").trim()))
    .filter((paragraph) => paragraph.length > 80);
  return paragraphs.slice(0, 2).join("\n\n");
}

interface PhilosophyExtras {
  coreConcepts: string[];
  mentalModel: string;
  antiPatterns: string;
  bridge: string;
  pullQuote: string;
}

const frExtras: Record<number, PhilosophyExtras> = {
  1: {
    coreConcepts: [
      "**1. Art de la Commande** — Passer d'une requête vague à un brief d'agence multidimensionnel (RACE/ROCOF).",
      "**2. Approche Cyborg/Centaure** — L'humain fournit le paragraphe-noyau stratégique ; l'IA structure et formate.",
      "**3. Contrôle qualité éditorial** — Détecter et éliminer le jargon IA avant publication.",
    ],
    mentalModel:
      "> **Modèle mental :** l'IA = partenaire d'agence junior. Brief rigoureux, cadrage précis, limites strictes, correction continue.",
    antiPatterns:
      "**Anti-patterns :** déléguer l'argument central à la machine ; accepter le premier brouillon ; prompts sans contraintes négatives ; publier sans relecture humaine.",
    bridge:
      "**Pont vers l'Atelier :** dans le scénario Horizon Mobilité, vous construirez un brief RACE complet avant toute génération — c'est l'application directe de cette philosophie.",
    pullQuote:
      "*« La valeur stratégique reste dans l'intellect humain ; l'IA n'a ni idée inhérente ni vision de marque. »*",
  },
  2: {
    coreConcepts: [
      "**1. Vocabulaire visuel** — Angles, lumière, focales et palettes comme leviers de commande.",
      "**2. Direction sans compétence graphique** — Penser directeur artistique, pas opérateur PAO.",
      "**3. Conformité dès la génération** — Provenance, filigrane et choix d'outil (Firefly vs Midjourney).",
    ],
    mentalModel:
      "> **Modèle mental :** le prompt visuel = fiche de tournage. Sans angle et lumière explicites, l'IA produit du plastique générique.",
    antiPatterns:
      "**Anti-patterns :** prompts « belle image professionnelle » ; Midjourney pour assets publics sans validation juridique ; ignorer l'EU AI Act sur les visages synthétiques.",
    bridge:
      "**Pont vers l'Atelier :** le carrousel LinkedIn Horizon Mobilité exige des prompts Firefly documentés — angle, lumière, palette — alignés sur la charte navy/blanc.",
    pullQuote:
      "*« Sans vocabulaire visuel, l'esthétique IA trahit immédiatement l'origine non humaine. »*",
  },
  3: {
    coreConcepts: [
      "**1. Économie de l'attention** — Hook 3 secondes, corps rythmé, CTA net.",
      "**2. Logique de déclinaison** — Un contenu long alimente scripts courts sans perdre le message central.",
      "**3. Stack fragmenté** — Script, storyboard, TTS, B-roll, montage : orchestration multi-outils.",
    ],
    mentalModel:
      "> **Modèle mental :** 30 secondes = une campagne compressée. Chaque seconde doit justifier sa place.",
    antiPatterns:
      "**Anti-patterns :** lire l'article en accéléré ; halluciner des chiffres absents du source ; un seul outil « tout-en-un » ; sous-titres oubliés.",
    bridge:
      "**Pont vers l'Atelier :** le Reel Horizon Mobilité part du blog 1000 mots — vous pratiquez la déclinaison Hook-Corps-CTA en conditions réelles.",
    pullQuote:
      "*« Arrêter le scroll en 3 secondes, livrer la valeur en 25, convertir en 2. »*",
  },
};

const enExtras: Record<number, PhilosophyExtras> = {
  1: {
    coreConcepts: [
      "**1. Art of the Command** — Move from vague queries to multi-layered agency briefs (RACE/ROCOF).",
      "**2. Cyborg/Centaur approach** — Humans supply the strategic core paragraph; AI structures and formats.",
      "**3. Editorial quality control** — Detect and remove AI jargon before publication.",
    ],
    mentalModel:
      "> **Mental model:** AI = junior agency partner. Rigorous brief, precise framing, strict boundaries, continuous correction.",
    antiPatterns:
      "**Anti-patterns:** delegating the core argument to the machine; accepting the first draft; prompts without negative constraints; publishing without human review.",
    bridge:
      "**Bridge to Workshop:** in the Horizon Mobility scenario, you build a complete RACE brief before any generation — direct application of this philosophy.",
    pullQuote:
      "*\"Strategic value stays in the human intellect; AI has no inherent ideas or brand vision.\"*",
  },
  2: {
    coreConcepts: [
      "**1. Visual vocabulary** — Angles, lighting, focal lengths, and palettes as command levers.",
      "**2. Direction without design skills** — Think art director, not DTP operator.",
      "**3. Compliance at generation** — Provenance, watermarking, and tool choice (Firefly vs Midjourney).",
    ],
    mentalModel:
      "> **Mental model:** a visual prompt = a shot list. Without explicit angle and lighting, AI produces generic plastic aesthetics.",
    antiPatterns:
      "**Anti-patterns:** \"professional beautiful image\" prompts; Midjourney for public assets without legal review; ignoring EU AI Act on synthetic faces.",
    bridge:
      "**Bridge to Workshop:** the Horizon Mobility LinkedIn carousel requires documented Firefly prompts — angle, lighting, palette — aligned with navy/white charter.",
    pullQuote:
      "*\"Without visual vocabulary, AI aesthetics instantly betray non-human origin.\"*",
  },
  3: {
    coreConcepts: [
      "**1. Attention economics** — 3-second hook, paced body, clear CTA.",
      "**2. Declination logic** — Long content feeds short scripts without losing the core message.",
      "**3. Fragmented stack** — Script, storyboard, TTS, b-roll, edit: multi-tool orchestration.",
    ],
    mentalModel:
      "> **Mental model:** 30 seconds = a compressed campaign. Every second must earn its place.",
    antiPatterns:
      "**Anti-patterns:** reading the article sped up; hallucinating figures absent from source; one \"all-in-one\" tool; forgotten captions.",
    bridge:
      "**Bridge to Workshop:** the Horizon Mobility Reel starts from a 1000-word blog — you practice Hook-Body-CTA declination in real conditions.",
    pullQuote:
      "*\"Stop the scroll in 3 seconds, deliver value in 25, convert in 2.\"*",
  },
};

function buildPhilosophyMarkdown(
  language: "fr" | "en",
  blocNumber: number,
  sourceBody: string,
  intro: string,
  lessonsExcerpt: string,
  illustrationsExcerpt: string,
): string {
  const extras = language === "fr" ? frExtras[blocNumber] : enExtras[blocNumber];
  const heading =
    language === "fr" ? "### Concepts fondamentaux" : "### Core concepts";
  const lessonsHeading =
    language === "fr" ? "### Approfondissement théorique" : "### Theoretical depth";
  const illustrationsHeading =
    language === "fr" ? "### Implications pratiques" : "### Practical implications";

  return [
    intro,
    sourceBody,
    heading,
    ...extras.coreConcepts,
    extras.mentalModel,
    lessonsHeading,
    lessonsExcerpt.slice(0, 1800),
    illustrationsHeading,
    illustrationsExcerpt.slice(0, 1200),
    extras.antiPatterns,
    extras.bridge,
    extras.pullQuote,
  ]
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}

function updateCourseFile(language: "fr" | "en", markdownByBloc: Record<number, string>): void {
  const filePath = join(contentDir, `course.${language}.json`);
  const course = JSON.parse(readFileSync(filePath, "utf8")) as {
    blocs: Array<{ id: number; sections: Array<{ id: string; markdown: string }> }>;
  };

  for (const bloc of course.blocs) {
    const philosophySection = bloc.sections.find((section) => section.id === "philosophy");
    if (philosophySection && markdownByBloc[bloc.id]) {
      philosophySection.markdown = markdownByBloc[bloc.id];
    }
  }

  writeFileSync(filePath, `${JSON.stringify(course, null, 2)}\n`, "utf8");
}

function main(): void {
  const writeMode = process.argv.includes("--write");
  const frMarkdown = readFileSync(frPath, "utf8");
  const enMarkdown = readFileSync(enPath, "utf8");
  const frIntro = extractProgramIntro(frMarkdown);
  const enIntro = extractProgramIntro(enMarkdown);

  const frByBloc: Record<number, string> = {};
  const enByBloc: Record<number, string> = {};

  for (const bloc of [1, 2, 3]) {
    const frBody = extractPhilosophyBody(frMarkdown, bloc);
    const enBody = extractPhilosophyBody(enMarkdown, bloc);
    frByBloc[bloc] = buildPhilosophyMarkdown(
      "fr",
      bloc,
      frBody,
      frIntro,
      extractSectionBody(frMarkdown, bloc, "Leçons"),
      extractSectionBody(frMarkdown, bloc, "Illustrations"),
    );
    enByBloc[bloc] = buildPhilosophyMarkdown(
      "en",
      bloc,
      enBody,
      enIntro,
      extractSectionBody(enMarkdown, bloc, "Course Lessons"),
      extractSectionBody(enMarkdown, bloc, "Real-Life Illustrations"),
    );

    const frWords = frByBloc[bloc].split(/\s+/).length;
    const enWords = enByBloc[bloc].split(/\s+/).length;
    console.log(`Bloc ${bloc} FR philosophy: ${frWords} words`);
    console.log(`Bloc ${bloc} EN philosophy: ${enWords} words`);
  }

  if (writeMode) {
    updateCourseFile("fr", frByBloc);
    updateCourseFile("en", enByBloc);
    console.log("\nUpdated course.fr.json and course.en.json");
  } else {
    console.log("\nDry run — pass --write to update course JSON files.");
  }
}

main();
