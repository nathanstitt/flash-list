import React, { createRef } from "react";
import { Text } from "react-native";
import "@quilted/react-testing/matchers";
import { render } from "@quilted/react-testing";

import { FlashListRef } from "../FlashListRef";
import { FlashList } from "..";

import { mountController, sized } from "./helpers/mountController";

// Every item measures 100px tall, the window 899px, as RecyclerView.test.tsx mocks them.
jest.mock("../recyclerview/utils/measureLayout", () => {
  const originalModule = jest.requireActual(
    "../recyclerview/utils/measureLayout"
  );
  return {
    ...originalModule,
    measureParentSize: jest.fn().mockImplementation(() => ({
      width: 399,
      height: 899,
    })),
    measureFirstChildLayout: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 399,
      height: 899,
    })),
    measureItemLayout: jest.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })),
  };
});

const scrollTo = (root: ReturnType<typeof render>, y: number) => {
  const scrollable = root.findWhere((node: any) => node.props.onScroll);
  if (!scrollable) throw new Error("Could not find scrollable component");
  const onScroll: any = scrollable.prop("onScroll" as never);
  root.act(() => {
    onScroll({
      nativeEvent: {
        contentOffset: { x: 0, y },
        contentSize: { width: 399, height: 3000 },
        layoutMeasurement: { width: 399, height: 899 },
      },
    });
  });
};

describe("the item held in place follows the scroll", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  it("holds the item first in view when data changes during a scroll that rendered nothing new", () => {
    // 30 items of 100px, all rendered (the draw distance covers the whole list), so a scroll
    // engages no new items and renders nothing.
    const data = Array.from({ length: 30 }, (_, i) => i);
    const ref = createRef<FlashListRef<number>>();
    const result = render(
      <FlashList
        ref={ref}
        data={data}
        keyExtractor={(item) => String(item)}
        drawDistance={5000}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    );
    result.act(() => jest.runAllTimers());
    const scrollToSpy = jest.fn();
    (ref.current?.getNativeScrollRef() as any).scrollTo = scrollToSpy;

    // The user scrolls to 1050 and keeps scrolling: item 10 is first in view, and the momentum
    // has not ended.
    scrollTo(result, 1050);

    // Three items arrive after item 2, above the view: 300px more above item 10.
    result.setProps({ data: [0, 1, 2, 100, 101, 102, ...data.slice(3)] });

    expect(scrollToSpy).toHaveBeenLastCalledWith({ y: 1350, animated: false });
  });

  it("keeps the item taken before a render that took new data until that render corrects", () => {
    // 50 items of 100px; item 20 is first in view at 2000.
    const { manager, controller, settle, shifts, unmount } = mountController({
      items: 50,
      itemHeight: 100,
      scrolledTo: 2000,
    });
    controller().computeFirstVisibleIndexForOffsetCorrection();

    // A render takes three new items after item 2, above the view: the manager moves to the
    // new layout before the render commits.
    const data = manager.props.data ?? [];
    const added = [{ key: "new-0" }, { key: "new-1" }, { key: "new-2" }];
    manager.updateProps({
      ...manager.props,
      data: [...data.slice(0, 3), ...added, ...data.slice(3)],
    });
    manager.processDataUpdate();

    // A scroll event arrives before that commit.
    controller().followScrollForOffsetCorrection();

    // The commit measures the new items and corrects: item 20 is 300px lower.
    settle(sized([3, 4, 5], 100));

    expect(shifts()).toEqual([300]);
    unmount();
  });
});
