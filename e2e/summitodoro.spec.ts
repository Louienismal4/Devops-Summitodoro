import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "summitodoro:expedition-profile",
      JSON.stringify({
        version: 1,
        displayName: "Trailblazer",
        avatarUrl: null,
        onboardingComplete: true,
        xp: 0,
        totalFocusMinutes: 0,
        completedSummits: 0,
        focusChain: 0,
        completedSessionIds: [],
        trailCoins: 0,
        lifetimeTrailCoinsEarned: 0,
        lifetimeTrailCoinsSpent: 0,
      }),
    );
  });
});

test("onboards a new hiker profile", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("summitodoro:expedition-profile");
  });
  await page.goto("/");

  const dialog = page.getByRole("dialog", {
    name: "Continue your expedition",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
});

test("loads directly into the expedition dashboard", async ({ page }) => {
  const hydrationErrors: string[] = [];
  const mapboxRequests: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      message.text().includes("A tree hydrated but some attributes")
    ) {
      hydrationErrors.push(message.text());
    }
  });
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("mapbox.com")) {
      mapboxRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Mt\. Pinatubo/ }),
  ).toBeVisible();
  await expect(page.getByLabel("0 Trail Coins")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Focus control" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Virtual expedition map" }),
  ).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  await expect(page.locator(".maplibregl-ctrl-attrib")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset camera" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit trail" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Toggle terrain" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Show map attribution and safety information",
    }),
  ).toBeVisible();
  expect(hydrationErrors).toEqual([]);
  expect(mapboxRequests).toEqual([]);
});

test("explains locked mountain requirements while retaining timer controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "45 min", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Deploy hiker" }),
  ).toBeEnabled();

  await page.getByRole("button", { name: /Mt\. Pinatubo/ }).click();
  await page
    .getByRole("option", { name: /Mt\. Ulap, Level 3 required/ })
    .click();
  const dialog = page.getByRole("dialog", { name: "Unlock Mt. Ulap?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Your level: 1")).toBeVisible();
  await expect(
    dialog.getByText(
      "You need to reach Level 3 before unlocking this mountain.",
    ),
  ).toBeVisible();
});

test("starts, pauses, and restores a session after refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "30 min", exact: true }).click();
  await page.getByRole("button", { name: "Deploy hiker" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
});

test("keeps timer controls available when the map provider fails", async ({
  page,
}) => {
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.abort("failed"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Deploy hiker" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("img", { name: /Virtual trail progress/ }),
  ).toBeVisible();
});

test("recovers an elapsed session directly at the summit", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "summitodoro:session:mt-pinatubo",
      JSON.stringify({
        version: 1,
        session: {
          id: "recovered-session",
          durationMs: 1_000,
          startedAt: Date.now() - 5_000,
          pausedAt: null,
          accumulatedPausedMs: 0,
          status: "running",
        },
        reachedCheckpointIds: ["lahar-canyon", "crater-rim"],
      }),
    );
  });

  await page.goto("/hike/mt-pinatubo");
  const completion = page.getByRole("dialog", { name: "Summit secured!" });
  await expect(completion).toBeVisible();
  await expect(completion.getByText("+100 XP")).toBeVisible();
});
