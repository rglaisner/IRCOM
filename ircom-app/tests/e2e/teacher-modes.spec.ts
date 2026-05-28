import { expect, test } from "@playwright/test";

function createMockTeacherResponse(interactionLabel: string) {
  return {
    data: {
      title: `Feedback ${interactionLabel}`,
      feedback: `Structured feedback for ${interactionLabel}.`,
      nextStep: `Next step for ${interactionLabel}.`,
      critiqueChecklist: [
        "Check strategic objective",
        "Reduce generic AI wording",
        "Strengthen audience specificity",
      ],
      qualityScore: 72,
    },
  };
}

test.beforeEach(async ({ page }) => {
  let requestCounter = 0;

  await page.route("**/api/teacher", async (route) => {
    requestCounter += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createMockTeacherResponse(`request-${requestCounter}`)),
    });
  });

  await page.route("**/api/atelier/narrate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body: "Briefing vocal simulé pour ce scénario. Vous pouvez interrompre pour poser une question.",
    });
  });

  await page.route("**/api/atelier/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { answer: "Réponse coach simulée pour votre question." },
      }),
    });
  });
});

test("switches FR/EN and keeps context across modes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Parcours formation — 12 h")).toBeVisible();

  await page.getByTestId("language-select").selectOption("en");
  await expect(page.getByText("Training journey — 12 hours")).toBeVisible();

  await page.getByLabel("Main").getByRole("link", { name: "Course" }).click();
  await expect(page.getByText("Course — Block 1")).toBeVisible();

  await page.getByRole("link", { name: "Journey" }).click();
  await expect(page.getByText("Four hands-on blocks")).toBeVisible();
});

test("cours mode is read-only with section navigation", async ({ page }) => {
  await page.goto("/coach?bloc=1");

  await expect(page.getByText("Cours — Bloc 1")).toBeVisible();
  await expect(page.getByTestId("cours-section-philosophy")).toBeVisible();
  await expect(page.getByTestId("cours-go-atelier")).toBeVisible();
  await expect(page.getByTestId("coach-submit")).toHaveCount(0);
});

test("atelier mode supports scenario pick, narration, and deliverable submit", async ({ page }) => {
  await page.goto("/exercise?bloc=1&scenario=b1-mobilite-launch");

  await expect(page.getByTestId("scenario-card-b1-mobilite-launch")).toBeVisible();
  await page.getByTestId("narration-start").click();
  await expect(page.getByTestId("narration-transcript")).toContainText("Briefing vocal");

  await page.getByTestId("toggle-deliverable-panel").click();
  await page.getByTestId("exercise-input").fill("Draft campaign attempt one");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-1");
  await expect(page.getByText("1 / 2")).toBeVisible();

  await page.getByTestId("exercise-input").fill("Revised campaign attempt two");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-2");
});

test("sprint mode supports scenario A and two feedback interactions", async ({ page }) => {
  await page.goto("/sprint");

  await page.getByTestId("sprint-scenario-A").click();
  await expect(page.getByTestId("sprint-brief")).toBeVisible();
  await page.getByTestId("narration-start").click();
  await expect(page.getByTestId("narration-transcript")).toContainText("Briefing");

  await page.getByTestId("sprint-input").fill("Mission request one");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-1");

  await page.getByTestId("sprint-input").fill("Mission request two");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-2");
});

test("cross-mode persistence tracks four completed atelier+sprint interactions", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/exercise?bloc=1&scenario=b1-mobilite-launch");
  await page.getByTestId("toggle-deliverable-panel").click();
  await page.getByTestId("exercise-input").fill("Atelier one");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-1");
  await page.getByTestId("exercise-input").fill("Atelier two");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-2");

  await page.goto("/sprint");
  await page.getByTestId("sprint-input").fill("Sprint one");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-3");
  await page.getByTestId("sprint-input").fill("Sprint two");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-4");

  await page.goto("/");
  await expect(page.getByTestId("atelier-progress-card")).toContainText("2 / 2");
  await expect(page.getByTestId("sprint-progress-card")).toContainText("2 / 2");
});

test("mobile viewport has no horizontal scroll on dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
