import { describe, expect, it } from "vitest";

import { formatRemainingTime } from "./format-time";

describe("formatRemainingTime", () => {
  it("formats a countdown as hours, minutes, and seconds", () => {
    expect(formatRemainingTime(3_661_000)).toBe("01:01:01");
    expect(formatRemainingTime(30 * 60_000)).toBe("00:30:00");
    expect(formatRemainingTime(0)).toBe("00:00:00");
  });
});
