import { describe, expect, it } from "vitest";
import { getLevelOptions, levelToPercent } from "./levels";

describe("language level labels", () => {
  it("returns French labels for a French CV", () => {
    expect(getLevelOptions("fr")).toContain("Langue maternelle");
    expect(getLevelOptions("fr")).toContain("Débutant");
  });

  it("returns English labels for an English CV", () => {
    expect(getLevelOptions("en")).toContain("Native speaker");
    expect(getLevelOptions("en")).toContain("Beginner");
  });

  it("converts English labels to percentages", () => {
    expect(levelToPercent({ name: "English", level: "Native speaker" })).toBe(100);
    expect(levelToPercent({ name: "English", level: "B1" })).toBe(62);
    expect(levelToPercent({ name: "English", level: "Beginner" })).toBe(15);
  });
});
