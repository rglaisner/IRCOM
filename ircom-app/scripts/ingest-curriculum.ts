/**
 * Extract course sections from curriculum markdown and merge into course.*.json.
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

function buildCompactProgramIntro(language: "fr" | "en"): string {
  if (language === "fr") {
    return [
      "### Principes directeurs",
      "",
      "- **Valeur humaine** — L'IA ne possède ni idées, ni vision stratégique, ni empathie ; la valeur reste dans l'intellect humain.",
      "- **Posture professionnelle** — Gérez l'IA comme un assistant junior : brief rigoureux, cadrage précis, limites strictes, correction continue.",
      "- **Pragmatisme** — La technologie n'est qu'un levier d'exécution au service de la réflexion critique et de l'intention stratégique.",
    ].join("\n");
  }

  return [
    "### Guiding principles",
    "",
    "- **Human value** — AI has no inherent ideas, strategic vision, or empathy; value stays in the human intellect.",
    "- **Professional posture** — Manage AI like a junior assistant: rigorous brief, precise framing, strict boundaries, continuous correction.",
    "- **Pragmatism** — Technology is only a lever of execution in service of critical reflection and strategic intent.",
  ].join("\n");
}

function splitLongParagraph(text: string, maxLength = 340): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = `${current}${sentence}`;
    if (candidate.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
      continue;
    }
    current = candidate;
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

function structurePhilosophyBody(body: string, language: "fr" | "en"): string {
  const heading = language === "fr" ? "### Enjeu du bloc" : "### Block focus";
  const paragraphs = body
    .split(/\n+/)
    .flatMap((paragraph) => splitLongParagraph(stripFootnotes(paragraph.trim())))
    .filter((paragraph) => paragraph.length > 0);

  if (paragraphs.length === 0) {
    return "";
  }

  return [heading, ...paragraphs].join("\n\n");
}

function normalizeMarkdownBody(body: string): string {
  return body
    .replace(/\.\s+(\|)/g, ".\n\n$1")
    .replace(/(\|)\s+(?=[A-Za-zÀ-ÿ«])/gu, "$1\n\n")
    .replace(/\.\s+(\d+\.\s+\*\*)/g, ".\n\n$1");
}

interface SectionExtras {
  coreConcepts: string[];
  mentalModel: string;
  workedExample: string;
  bridge: string;
  pullQuote: string;
}

interface IllustrationsExtras {
  checklist: string[];
  antiPatterns: string;
  bridge: string;
  pullQuote: string;
}

const frLessonsExtras: Record<number, SectionExtras> = {
  1: {
    coreConcepts: [
      "**1. RACE/ROCOF** — Rôle, Objectif/Action, Contexte, Contraintes, Format : le couloir opérationnel du LLM.",
      "**2. Prompts négatifs** — Balises `<bans>` et `<prefer>` pour forcer un couloir sémantique authentique.",
      "**3. Itération Cyborg** — L'humain fournit le paragraphe-noyau ; l'IA structure et formate.",
    ],
    mentalModel:
      "> **Modèle mental :** un prompt = un brief d'agence. Sans Rôle et Contraintes, le LLM régresse vers la médiane statistique.",
    workedExample:
      "**Exemple opérationnel :** « Agis en concepteur-rédacteur B2B senior ; rédige un fil LinkedIn en 3 parties sur les retards supply chain ; public : cadres inquiets sur les marges T3 ; sans emojis ; < 150 mots par post ; tableau Markdown avec Accroche / Corps / CTA. »",
    bridge:
      "**Pont vers l'Atelier :** le scénario Horizon Mobilité vous demande de produire un brief RACE complet avant toute génération — c'est l'application directe de ces frameworks.",
    pullQuote:
      "*« Sans framework, le LLM produit du texte fade, générique et dépourvu de singularité de marque. »*",
  },
  2: {
    coreConcepts: [
      "**1. Vocabulaire visuel** — Angles (gros plan, plan débullé, drone), lumière (volumétrique, heure dorée), focales.",
      "**2. Intégration PAO** — Firefly dans Photoshop, Illustrator, InDesign : Generative Expand, typographie, vecteurs.",
      "**3. Choix d'outil** — Firefly pour assets publics (licence, indemnisation) ; Midjourney pour moodboards internes.",
    ],
    mentalModel:
      "> **Modèle mental :** le prompt visuel = fiche de tournage. Sans angle et lumière explicites, l'IA produit du plastique générique.",
    workedExample:
      "**Exemple opérationnel :** « Plan moyen, éclairage Rembrandt, palette navy #071554 et blanc #ffffff, style éditorial corporate, sujet : cadre dirigeant devant skyline urbain, focale 85mm, profondeur de champ réduite. »",
    bridge:
      "**Pont vers l'Atelier :** le carrousel LinkedIn Horizon Mobilité exige des prompts Firefly documentés — angle, lumière, palette — alignés sur la charte.",
    pullQuote:
      "*« Diriger un générateur d'images nécessite le vocabulaire des arts visuels, pas des compétences PAO. »*",
  },
  3: {
    coreConcepts: [
      "**1. Hook-Corps-CTA** — 3 secondes pour arrêter le scroll, 25 pour livrer la valeur, 2 pour convertir.",
      "**2. Déclinaison** — Un article long alimente scripts Reels/TikTok/Shorts sans perdre le message central.",
      "**3. Stack multi-outils** — Script → storyboard → TTS → B-roll → montage : orchestration fragmentée.",
    ],
    mentalModel:
      "> **Modèle mental :** 30 secondes = une campagne compressée. Chaque seconde doit justifier sa place.",
    workedExample:
      "**Exemple opérationnel :** « À partir de l'article blog Horizon Mobilité (1000 mots), produis un script Reel 30s : Hook question rhétorique (3s), Corps 3 points clés avec chiffres source (22s), CTA inscription newsletter (5s). Sous-titres obligatoires. »",
    bridge:
      "**Pont vers l'Atelier :** le Reel Horizon Mobilité part du blog 1000 mots — vous pratiquez la déclinaison Hook-Corps-CTA en conditions réelles.",
    pullQuote:
      "*« Arrêter le scroll en 3 secondes, livrer la valeur en 25, convertir en 2. »*",
  },
};

const enLessonsExtras: Record<number, SectionExtras> = {
  1: {
    coreConcepts: [
      "**1. RACE/ROCOF** — Role, Objective/Action, Context, Constraints, Format: the LLM's operational corridor.",
      "**2. Negative prompts** — `<bans>` and `<prefer>` tags to force authentic semantic corridors.",
      "**3. Cyborg iteration** — Humans supply the core paragraph; AI structures and formats.",
    ],
    mentalModel:
      "> **Mental model:** a prompt = an agency brief. Without Role and Constraints, the LLM regresses to statistical median.",
    workedExample:
      "**Operational example:** \"Act as a senior B2B copywriter; write a 3-part LinkedIn thread on supply chain delays; audience: executives worried about Q3 margins; no emojis; < 150 words per post; Markdown table with Hook / Body / CTA.\"",
    bridge:
      "**Bridge to Workshop:** the Horizon Mobility scenario asks you to produce a complete RACE brief before any generation — direct application of these frameworks.",
    pullQuote:
      "*\"Without a framework, the LLM produces bland, generic text devoid of brand singularity.\"*",
  },
  2: {
    coreConcepts: [
      "**1. Visual vocabulary** — Angles (close-up, wide shot, drone), lighting (volumetric, golden hour), focal lengths.",
      "**2. DTP integration** — Firefly in Photoshop, Illustrator, InDesign: Generative Expand, typography, vectors.",
      "**3. Tool choice** — Firefly for public assets (licensing, indemnification); Midjourney for internal moodboards.",
    ],
    mentalModel:
      "> **Mental model:** a visual prompt = a shot list. Without explicit angle and lighting, AI produces generic plastic aesthetics.",
    workedExample:
      "**Operational example:** \"Medium shot, Rembrandt lighting, navy #071554 and white #ffffff palette, corporate editorial style, subject: executive before urban skyline, 85mm focal length, shallow depth of field.\"",
    bridge:
      "**Bridge to Workshop:** the Horizon Mobility LinkedIn carousel requires documented Firefly prompts — angle, lighting, palette — aligned with the charter.",
    pullQuote:
      "*\"Directing an image generator requires visual arts vocabulary, not DTP skills.\"*",
  },
  3: {
    coreConcepts: [
      "**1. Hook-Body-CTA** — 3 seconds to stop the scroll, 25 to deliver value, 2 to convert.",
      "**2. Declination** — Long article feeds Reels/TikTok/Shorts scripts without losing the core message.",
      "**3. Multi-tool stack** — Script → storyboard → TTS → b-roll → edit: fragmented orchestration.",
    ],
    mentalModel:
      "> **Mental model:** 30 seconds = a compressed campaign. Every second must earn its place.",
    workedExample:
      "**Operational example:** \"From the Horizon Mobility blog article (1000 words), produce a 30s Reel script: rhetorical question hook (3s), body with 3 key points and source figures (22s), newsletter signup CTA (5s). Captions mandatory.\"",
    bridge:
      "**Bridge to Workshop:** the Horizon Mobility Reel starts from the 1000-word blog — you practice Hook-Body-CTA declination in real conditions.",
    pullQuote:
      "*\"Stop the scroll in 3 seconds, deliver value in 25, convert in 2.\"*",
  },
};

const frIllustrationsExtras: Record<number, IllustrationsExtras> = {
  1: {
    checklist: [
      "Repérer les tics structurels : « Il ne s'agit pas seulement de… », conclusions trop optimistes.",
      "Éliminer le lexique galvaudé : *incontournable, catalyseur, à l'ère de, véritable levier*.",
      "Utiliser `<bans>` et `<prefer>` dans le prompt pour forcer un couloir sémantique.",
      "Relire humainement avant publication — le contrôle qualité reste obligatoire.",
    ],
    antiPatterns:
      "**Anti-patterns :** publier le premier brouillon IA ; ignorer les tics sémantiques ; prompts sans contraintes négatives ; déléguer l'argument central à la machine.",
    bridge:
      "**Pont vers l'Atelier :** dans Horizon Mobilité, vous relisez et corrigez le copy généré avant soumission — pratique directe du contrôle anti-jargon.",
    pullQuote:
      "*« Les tics IA trahissent instantanément l'origine non humaine et dégradent la confiance du lecteur. »*",
  },
  2: {
    checklist: [
      "Vérifier la provenance des données d'entraînement (Firefly vs Midjourney).",
      "Documenter angle, lumière et palette dans chaque prompt visuel.",
      "Intégrer filigranes et métadonnées de provenance (EU AI Act, art. 50).",
      "Réserver Midjourney aux moodboards internes, jamais aux assets publics finaux.",
    ],
    antiPatterns:
      "**Anti-patterns :** prompts « belle image professionnelle » ; Midjourney pour assets publics sans validation juridique ; ignorer l'EU AI Act sur les visages synthétiques.",
    bridge:
      "**Pont vers l'Atelier :** le carrousel LinkedIn exige des visuels Firefly conformes — vous pratiquez la checklist conformité en conditions réelles.",
    pullQuote:
      "*« La dichotomie Firefly/Midjourney = capacité artistique vs responsabilité légale. »*",
  },
  3: {
    checklist: [
      "1. Extraire le message central de l'article source (pas de lecture accélérée).",
      "2. Rédiger le script Hook-Corps-CTA avec chiffres vérifiables du source.",
      "3. Générer storyboard et B-roll avec prompts visuels documentés.",
      "4. Ajouter sous-titres et CTA avant export final.",
    ],
    antiPatterns:
      "**Anti-patterns :** lire l'article en accéléré ; halluciner des chiffres absents du source ; un seul outil « tout-en-un » ; sous-titres oubliés.",
    bridge:
      "**Pont vers l'Atelier :** le Reel Horizon Mobilité suit ce workflow en 4 étapes — de l'article source au script final.",
    pullQuote:
      "*« 30 secondes = une campagne compressée. Chaque seconde doit justifier sa place. »*",
  },
};

const enIllustrationsExtras: Record<number, IllustrationsExtras> = {
  1: {
    checklist: [
      "Spot structural tics: \"It's not just about…\", overly optimistic conclusions.",
      "Eliminate overused lexicon: *landscape, catalyst, in the era of, true lever*.",
      "Use `<bans>` and `<prefer>` in prompts to force semantic corridors.",
      "Human review before publication — quality control remains mandatory.",
    ],
    antiPatterns:
      "**Anti-patterns:** publishing the first AI draft; ignoring semantic tics; prompts without negative constraints; delegating the core argument to the machine.",
    bridge:
      "**Bridge to Workshop:** in Horizon Mobility, you review and correct generated copy before submission — direct anti-jargon control practice.",
    pullQuote:
      "*\"AI tics instantly betray non-human origin and degrade reader trust.\"*",
  },
  2: {
    checklist: [
      "Verify training data provenance (Firefly vs Midjourney).",
      "Document angle, lighting, and palette in every visual prompt.",
      "Integrate watermarks and provenance metadata (EU AI Act, Art. 50).",
      "Reserve Midjourney for internal moodboards, never final public assets.",
    ],
    antiPatterns:
      "**Anti-patterns:** \"professional beautiful image\" prompts; Midjourney for public assets without legal review; ignoring EU AI Act on synthetic faces.",
    bridge:
      "**Bridge to Workshop:** the LinkedIn carousel requires compliant Firefly visuals — you practice the compliance checklist in real conditions.",
    pullQuote:
      "*\"The Firefly/Midjourney dichotomy = artistic capability vs legal responsibility.\"*",
  },
  3: {
    checklist: [
      "1. Extract the core message from the source article (no sped-up reading).",
      "2. Write the Hook-Body-CTA script with verifiable figures from source.",
      "3. Generate storyboard and b-roll with documented visual prompts.",
      "4. Add captions and CTA before final export.",
    ],
    antiPatterns:
      "**Anti-patterns:** reading the article sped up; hallucinating figures absent from source; one \"all-in-one\" tool; forgotten captions.",
    bridge:
      "**Bridge to Workshop:** the Horizon Mobility Reel follows this 4-step workflow — from source article to final script.",
    pullQuote:
      "*\"30 seconds = a compressed campaign. Every second must earn its place.\"*",
  },
};

function buildLessonsMarkdown(
  language: "fr" | "en",
  blocNumber: number,
  sourceBody: string,
): string {
  const extras = language === "fr" ? frLessonsExtras[blocNumber] : enLessonsExtras[blocNumber];
  const heading = language === "fr" ? "### Points clés" : "### Key takeaways";
  const exampleHeading = language === "fr" ? "### Exemple opérationnel" : "### Operational example";

  return [
    normalizeMarkdownBody(sourceBody),
    heading,
    ...extras.coreConcepts,
    extras.mentalModel,
    exampleHeading,
    extras.workedExample,
    extras.bridge,
    extras.pullQuote,
  ]
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}

function buildIllustrationsMarkdown(
  language: "fr" | "en",
  blocNumber: number,
  sourceBody: string,
): string {
  const extras =
    language === "fr" ? frIllustrationsExtras[blocNumber] : enIllustrationsExtras[blocNumber];
  const checklistHeading =
    language === "fr" ? "### Checklist pratique" : "### Practical checklist";

  return [
    normalizeMarkdownBody(sourceBody),
    checklistHeading,
    ...extras.checklist.map((item) => (item.match(/^\d+\./) ? item : `- ${item}`)),
    extras.antiPatterns,
    extras.bridge,
    extras.pullQuote,
  ]
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
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
): string {
  const extras = language === "fr" ? frExtras[blocNumber] : enExtras[blocNumber];
  const heading =
    language === "fr" ? "### Concepts fondamentaux" : "### Core concepts";
  const lessonsRef =
    language === "fr"
      ? "### Approfondissement théorique\n\nConsultez la section **Leçons** pour les frameworks RACE/ROCOF, exemples opérationnels et modèles mentaux détaillés."
      : "### Theoretical depth\n\nSee the **Lessons** section for RACE/ROCOF frameworks, operational examples, and detailed mental models.";
  const illustrationsRef =
    language === "fr"
      ? "### Implications pratiques\n\nConsultez la section **Illustrations** pour les checklists, anti-patterns et cas concrets du curriculum."
      : "### Practical implications\n\nSee the **Illustrations** section for checklists, anti-patterns, and real-world cases from the curriculum.";

  return [
    buildCompactProgramIntro(language),
    structurePhilosophyBody(sourceBody, language),
    heading,
    ...extras.coreConcepts,
    extras.mentalModel,
    lessonsRef,
    illustrationsRef,
    extras.antiPatterns,
    extras.bridge,
    extras.pullQuote,
  ]
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}

type SectionUpdates = Record<
  number,
  { philosophy?: string; lessons?: string; illustrations?: string }
>;

function updateCourseFile(language: "fr" | "en", updates: SectionUpdates): void {
  const filePath = join(contentDir, `course.${language}.json`);
  const course = JSON.parse(readFileSync(filePath, "utf8")) as {
    blocs: Array<{ id: number; sections: Array<{ id: string; markdown: string }> }>;
  };

  for (const bloc of course.blocs) {
    const blocUpdates = updates[bloc.id];
    if (!blocUpdates) {
      continue;
    }
    for (const sectionId of ["philosophy", "lessons", "illustrations"] as const) {
      const markdown = blocUpdates[sectionId];
      if (!markdown) {
        continue;
      }
      const section = bloc.sections.find((item) => item.id === sectionId);
      if (section) {
        section.markdown = markdown;
      }
    }
  }

  writeFileSync(filePath, `${JSON.stringify(course, null, 2)}\n`, "utf8");
}

function main(): void {
  const writeMode = process.argv.includes("--write");
  const frMarkdown = readFileSync(frPath, "utf8");
  const enMarkdown = readFileSync(enPath, "utf8");
  const frUpdates: SectionUpdates = {};
  const enUpdates: SectionUpdates = {};

  for (const bloc of [1, 2, 3]) {
    const frBody = extractPhilosophyBody(frMarkdown, bloc);
    const enBody = extractPhilosophyBody(enMarkdown, bloc);
    const frLessonsBody = extractSectionBody(frMarkdown, bloc, "Leçons");
    const enLessonsBody = extractSectionBody(enMarkdown, bloc, "Course Lessons");
    const frIllustrationsBody = extractSectionBody(frMarkdown, bloc, "Illustrations");
    const enIllustrationsBody = extractSectionBody(enMarkdown, bloc, "Real-Life Illustrations");

    frUpdates[bloc] = {
      philosophy: buildPhilosophyMarkdown("fr", bloc, frBody),
      lessons: buildLessonsMarkdown("fr", bloc, frLessonsBody),
      illustrations: buildIllustrationsMarkdown("fr", bloc, frIllustrationsBody),
    };
    enUpdates[bloc] = {
      philosophy: buildPhilosophyMarkdown("en", bloc, enBody),
      lessons: buildLessonsMarkdown("en", bloc, enLessonsBody),
      illustrations: buildIllustrationsMarkdown("en", bloc, enIllustrationsBody),
    };

    console.log(`Bloc ${bloc} FR philosophy: ${frUpdates[bloc].philosophy!.split(/\s+/).length} words`);
    console.log(`Bloc ${bloc} FR lessons: ${frUpdates[bloc].lessons!.split(/\s+/).length} words`);
    console.log(
      `Bloc ${bloc} FR illustrations: ${frUpdates[bloc].illustrations!.split(/\s+/).length} words`,
    );
    console.log(`Bloc ${bloc} EN philosophy: ${enUpdates[bloc].philosophy!.split(/\s+/).length} words`);
    console.log(`Bloc ${bloc} EN lessons: ${enUpdates[bloc].lessons!.split(/\s+/).length} words`);
    console.log(
      `Bloc ${bloc} EN illustrations: ${enUpdates[bloc].illustrations!.split(/\s+/).length} words`,
    );
  }

  if (writeMode) {
    updateCourseFile("fr", frUpdates);
    updateCourseFile("en", enUpdates);
    console.log("\nUpdated course.fr.json and course.en.json");
  } else {
    console.log("\nDry run — pass --write to update course JSON files.");
  }
}

main();
