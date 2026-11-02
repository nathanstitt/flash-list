/**
 * How a platform moves the scroll position when maintainVisibleContentPosition
 * corrects for a size change above the first visible item.
 * - "anchor": moves the ScrollAnchor view that the native scroll view's own
 *   maintainVisibleContentPosition follows.
 * - "scrollTo": scrolls to the last reported offset plus the difference.
 * - "scrollTop": moves the DOM scroller by the difference from where it is now
 *   (web), with the browser's own scroll anchoring turned off.
 */
export type OffsetCorrection = "anchor" | "scrollTo" | "scrollTop";
//# sourceMappingURL=OffsetCorrection.d.ts.map