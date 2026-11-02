import { mountController, range, sized, sum } from "./helpers/mountController";

describe("useRecyclerViewController offset correction", () => {
  it("holds an anchor that measurements above it pushed out of the rendered window", () => {
    // Items above the anchor turn out far smaller than the layout had them (estimates being
    // measured, or the running estimate dropping): the anchor's layout moves up past the engaged
    // window while the user has not scrolled, so it is still the item on screen and must be held.
    const { manager, controller, shifts, settle, unmount } = mountController({
      items: 60,
      itemHeight: 500,
      scrolledTo: 15000,
    });
    controller().computeFirstVisibleIndexForOffsetCorrection();
    const anchorBefore = manager.getLayout(30).y;

    settle(sized(range(0, 20), 50));

    expect(manager.getEngagedIndices().toArray()).not.toContain(30);
    expect(sum(shifts())).toBe(manager.getLayout(30).y - anchorBefore);
    expect(sum(shifts())).not.toBe(0);
    unmount();
  });

  it("does not hold an anchor the user scrolled away from", () => {
    const { manager, controller, shifts, settle, unmount } = mountController({
      items: 60,
      itemHeight: 500,
      scrolledTo: 15000,
    });
    controller().computeFirstVisibleIndexForOffsetCorrection();

    // The user moves far down; the recorded anchor is no longer on screen.
    manager.updateScrollOffset(25000);
    settle(sized(range(0, 20), 50));

    expect(shifts()).toEqual([]);
    unmount();
  });
});
