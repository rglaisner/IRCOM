import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMarkdownBlocks } from "@/lib/markdown/parse-markdown-blocks";

describe("parseMarkdownBlocks", () => {
  it("groups bullet items into a single list", () => {
    const blocks = parseMarkdownBlocks("- First\n- Second");
    assert.deepEqual(blocks, [{ type: "ul", items: ["First", "Second"] }]);
  });

  it("parses numbered concept lines", () => {
    const blocks = parseMarkdownBlocks("**1. Art de la Commande** — Brief multidimensionnel.");
    assert.equal(blocks[0]?.type, "concept");
    assert.equal((blocks[0] as { number: string }).number, "1");
  });

  it("splits inline tables from prose", () => {
    const blocks = parseMarkdownBlocks(
      "Intro paragraph. | Col A | Col B |\n| --- | --- |\n| One | Two |",
    );
    assert.equal(blocks[0]?.type, "paragraph");
    assert.equal(blocks[1]?.type, "table");
  });

  it("detects callout and pullquote blocks", () => {
    const blocks = parseMarkdownBlocks(
      "**Anti-patterns :** publier sans relecture.\n\n*« Citation clé. »*",
    );
    assert.equal(blocks[0]?.type, "callout");
    assert.equal(blocks[1]?.type, "pullquote");
  });
});
