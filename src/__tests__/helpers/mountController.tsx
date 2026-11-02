import React, { createRef } from "react";
import TestRenderer, { act } from "react-test-renderer";

import { useRecyclerViewController } from "../../recyclerview/hooks/useRecyclerViewController";
import { RecyclerViewManager } from "../../recyclerview/RecyclerViewManager";
import { FlashListRef } from "../../FlashListRef";
import { CompatScroller } from "../../recyclerview/components/CompatScroller";

// renderHook mounts a hook with react-test-renderer, which the other
// tests already use, so these tests need no extra testing library.
const renderHook = <T,>(hook: () => T) => {
  const result = { current: undefined as unknown as T };
  const Probe = () => {
    result.current = hook();
    return null;
  };
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  act(() => {
    renderer = TestRenderer.create(<Probe />);
  });
  return {
    result,
    unmount: () =>
      act(() => {
        renderer?.unmount();
      }),
  };
};

interface Item {
  key: string;
}

const WINDOW = { width: 400, height: 800 };

const propsFor = (keys: string[]) => ({
  data: keys.map((key) => ({ key })),
  keyExtractor: (item: Item) => item.key,
  renderItem: () => null,
  maintainVisibleContentPosition: {},
});

export const sized = (indices: number[], height: number) =>
  indices.map((index) => ({
    index,
    dimensions: { width: WINDOW.width, height },
  }));

export const range = (start: number, end: number) =>
  Array.from({ length: end - start }, (_, index) => start + index);

export const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

/**
 * A list of `items` items, each `itemHeight` tall and measured, scrolled to `scrolledTo`.
 * `scrollableNode` is what the scroller's `getScrollableNode` returns (the DOM scroller on web).
 */
export const mountController = ({
  items = 10,
  itemHeight = 200,
  scrolledTo = 250,
  scrollableNode = undefined as unknown,
} = {}) => {
  const keys = Array.from({ length: items }, (_, index) => `item-${index}`);
  const manager = new RecyclerViewManager<Item>(propsFor(keys));
  const all = keys.map((_, index) => index);

  manager.updateLayoutParams(WINDOW, 0);
  // Every item measured, so the initial progressive render completes; until then scroll
  // offsets are not applied.
  for (let pass = 0; pass < 5; pass++) {
    if (!manager.modifyChildrenLayout(sized(all, itemHeight), items)) {
      break;
    }
  }
  manager.isFirstPaintOnUiComplete = true;
  manager.updateScrollOffset(scrolledTo);

  const scrollBy = jest.fn();
  const scrollTo = jest.fn();
  const ref = createRef<FlashListRef<Item>>();
  const scrollViewRef = {
    current: {
      scrollTo,
      getScrollableNode: () => scrollableNode,
    } as unknown as CompatScroller,
  };
  const scrollAnchorRef = { current: { scrollBy } };
  const hook = renderHook(() =>
    useRecyclerViewController(manager, ref, scrollViewRef, scrollAnchorRef)
  );
  const controller = () => hook.result.current;

  /**
   * Every shift applied through the scroller's API so far: by moving the anchor view where the
   * platform supports it, by a plain scroll otherwise. Both are the same shift.
   */
  const shifts = () => [
    ...scrollBy.mock.calls.map(([diff]: [number]) => diff),
    ...scrollTo.mock.calls.map(
      ([params]: [{ y: number }]) => params.y - scrolledTo
    ),
  ];

  /**
   * Layout passes as the list runs them after a measurement: each pass that needs another render
   * renders again (and recomputes the rendered window); the pass with nothing left to re-render
   * applies the offset correction.
   */
  const settle = (measured: ReturnType<typeof sized>) => {
    let changed = manager.modifyChildrenLayout(
      measured,
      manager.getDataLength()
    );
    let passes = 0;
    while (changed && passes++ < 5) {
      changed = manager.modifyChildrenLayout([], manager.getDataLength());
    }
    act(() => controller().applyOffsetCorrection());
  };

  return {
    manager,
    controller,
    shifts,
    settle,
    scrollTo,
    scrollBy,
    unmount: hook.unmount,
  };
};
