import { describe, expect, it } from "vitest";
import { buildBreadcrumbs, scoreIndexMatch } from "../src/turath/index-utils.js";
import { dedupeSearchResults } from "../src/turath/search-utils.js";

describe("dedupe", () => {
  it("merges same book_id + page", () => {
    const merged = dedupeSearchResults([
      { book_id: 1, author_id: 1, book_name: "b", author_name: "a", page: 2, page_id: null, vol: null, headings: [], snip: "x", text: "t1" },
      { book_id: 1, author_id: 1, book_name: "b", author_name: "a", page: 2, page_id: null, vol: null, headings: [], snip: "y", text: "t2" }
    ]);
    expect(merged).toHaveLength(1);
  });
});

describe("breadcrumb", () => {
  it("builds and resets path by level", () => {
    const items = buildBreadcrumbs([
      { title: "A", page: 1, level: 1 },
      { title: "B", page: 2, level: 2 },
      { title: "C", page: 3, level: 3 },
      { title: "D", page: 4, level: 1 }
    ]);
    expect(items[2].breadcrumb).toEqual(["A", "B", "C"]);
    expect(items[3].breadcrumb).toEqual(["D"]);
  });
});

describe("index score", () => {
  it("gives exact match higher score", () => {
    const exact = scoreIndexMatch("المسيح", { title: "المسيح", page: 1, level: 1, breadcrumb: ["المسيح"] });
    const close = scoreIndexMatch("المسيح", { title: "باب في المسيح", page: 1, level: 1, breadcrumb: ["باب"] });
    expect(exact).toBeGreaterThan(close);
  });
});
