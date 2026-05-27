import { describe, expect, it } from "vitest";
import { normalizeArabic } from "../src/turath/normalize.js";

describe("normalizeArabic", () => {
  it("normalizes diacritics and alif forms", () => {
    expect(normalizeArabic("الإِسْلَام")).toBe("الاسلام");
    expect(normalizeArabic("آثار")).toBe("اثار");
  });

  it("normalizes alef maqsura and tatweel", () => {
    expect(normalizeArabic("فتوى")).toBe("فتوي");
    expect(normalizeArabic("العلــــم")).toBe("العلم");
  });
});
