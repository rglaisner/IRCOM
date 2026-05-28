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
});

test("switches FR/EN and keeps context across modes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Parcours formation — 12 h")).toBeVisible();

  await page.getByTestId("language-select").selectOption("en");
  await expect(page.getByText("Training journey — 12 hours")).toBeVisible();

  await page.getByRole("link", { name: "Coach" }).click();
  await expect(page.getByText("Block 1 — Brief coach")).toBeVisible();

  await page.getByRole("link", { name: "Journey" }).click();
  await expect(page.getByText("Four hands-on blocks")).toBeVisible();
});

test("coach mode supports two contextual interactions", async ({ page }) => {
  await page.goto("/coach");

  await page.getByTestId("coach-input").fill("First coaching request");
  await page.getByTestId("coach-submit").click();
  await expect(page.getByTestId("coach-response")).toBeVisible();
  await expect(page.getByText("1 / 2")).toBeVisible();

  await page.getByTestId("coach-input").fill("Second coaching request");
  await page.getByTestId("coach-submit").click();
  await expect(page.getByTestId("coach-response")).toContainText("request-2");
  await expect(page.getByText("2 / 2")).toBeVisible();
});

test("exercise mode supports two iterative attempts", async ({ page }) => {
  await page.goto("/exercise");

  await page.getByTestId("exercise-input").fill("Draft campaign attempt one");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-1");
  await expect(page.getByText("1 / 2")).toBeVisible();

  await page.getByTestId("exercise-input").fill("Revised campaign attempt two");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-2");
  await expect(page.getByText("2 / 2")).toBeVisible();
});

test("sprint mode generates two mission interactions", async ({ page }) => {
  await page.goto("/sprint");

  await page.getByTestId("sprint-input").fill("Mission request one");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-1");
  await expect(page.getByText("1 / 2")).toBeVisible();

  await page.getByTestId("sprint-input").fill("Mission request two");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-2");
  await expect(page.getByText("2 / 2")).toBeVisible();
});

test("cross-mode persistence tracks six completed interactions", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.goto("/coach");
  await page.getByTestId("coach-input").fill("Coach one");
  await page.getByTestId("coach-submit").click();
  await expect(page.getByTestId("coach-response")).toContainText("request-1");
  await page.getByTestId("coach-input").fill("Coach two");
  await page.getByTestId("coach-submit").click();
  await expect(page.getByTestId("coach-response")).toContainText("request-2");

  await page.goto("/exercise");
  await page.getByTestId("exercise-input").fill("Exercise one");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-3");
  await page.getByTestId("exercise-input").fill("Exercise two");
  await page.getByTestId("exercise-submit").click();
  await expect(page.getByTestId("exercise-response")).toContainText("request-4");

  await page.goto("/sprint");
  await page.getByTestId("sprint-input").fill("Sprint one");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-5");
  await page.getByTestId("sprint-input").fill("Sprint two");
  await page.getByTestId("sprint-submit").click();
  await expect(page.getByTestId("sprint-response")).toContainText("request-6");

  await page.goto("/");
  await expect(page.getByTestId("coach-progress-card")).toContainText("2 / 2");
  await expect(page.getByTestId("exercise-progress-card")).toContainText("2 / 2");
  await expect(page.getByTestId("sprint-progress-card")).toContainText("2 / 2");
});

test("mobile viewport has no horizontal scroll on dashboard", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
