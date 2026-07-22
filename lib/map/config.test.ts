import { describe, expect, it } from "vitest";

import { DEFAULT_MAP_STYLE_URL, resolveMapStyleUrl } from "./config";

describe("map configuration", () => {
  it("uses OpenFreeMap when no style is configured", () => {
    expect(resolveMapStyleUrl()).toBe(DEFAULT_MAP_STYLE_URL);
    expect(resolveMapStyleUrl("  ")).toBe(DEFAULT_MAP_STYLE_URL);
  });

  it("accepts an HTTPS MapLibre style URL", () => {
    expect(resolveMapStyleUrl("https://maps.example.com/style.json")).toBe(
      "https://maps.example.com/style.json",
    );
  });

  it("rejects invalid and insecure style URLs", () => {
    expect(resolveMapStyleUrl("not-a-url")).toBe(DEFAULT_MAP_STYLE_URL);
    expect(resolveMapStyleUrl("http://maps.example.com/style.json")).toBe(
      DEFAULT_MAP_STYLE_URL,
    );
  });
});
