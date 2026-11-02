/**
 * Turns the browser's own scroll anchoring (CSS overflow-anchor, on by default
 * in Chrome and Firefox) off on the list's scroller. When an item above the
 * view grows, the browser would move scrollTop itself, and FlashList's own
 * correction would then move it a second time.
 */
export const WEB_SCROLLER_STYLE = { overflowAnchor: "none" } as const;

/**
 * Moves the DOM scroller by `diff` from where it is now. The offset of the last
 * scroll event can lag the DOM's scrollTop on web, so a correction computed
 * from it lands off by that lag.
 */
export function correctWebOffset(
  node: { scrollTop: number; scrollLeft: number },
  diff: number,
  horizontal: boolean
): void {
  if (horizontal) {
    node.scrollLeft += diff;
  } else {
    node.scrollTop += diff;
  }
}
