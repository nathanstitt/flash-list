import {
  correctWebOffset,
  WEB_SCROLLER_STYLE,
} from "../recyclerview/utils/webOffsetCorrection";

describe("web offset correction", () => {
  it("moves the DOM scroller by the difference from where it is now", () => {
    const node = { scrollTop: 900, scrollLeft: 0 };
    // The last scroll event said 850; the DOM is at 900. The result must not use 850.
    correctWebOffset(node, 100, false);
    expect(node.scrollTop).toBe(1000);
    expect(node.scrollLeft).toBe(0);
  });

  it("moves sideways for a horizontal list", () => {
    const node = { scrollTop: 0, scrollLeft: 40 };
    correctWebOffset(node, -10, true);
    expect(node.scrollLeft).toBe(30);
    expect(node.scrollTop).toBe(0);
  });

  it("turns the browser's own scroll anchoring off on the scroller", () => {
    expect(WEB_SCROLLER_STYLE).toEqual({ overflowAnchor: "none" });
  });
});
