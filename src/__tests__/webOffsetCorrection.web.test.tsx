import React, { createRef } from "react";
import { I18nManager, ScrollView, StyleSheet, Text } from "react-native";
import "@quilted/react-testing/matchers";
import { render } from "@quilted/react-testing";

import { FlashList } from "..";
import { FlashListRef } from "../FlashListRef";

import { mountController, sized, sizedAcross } from "./helpers/mountController";

// The web platform config, as react-native-web's bundler resolves it.
jest.mock("../native/config/PlatformHelper", () =>
  jest.requireActual("../native/config/PlatformHelper.web")
);

// Fixed measurements, as RecyclerView.test.tsx mocks them.
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

describe("useRecyclerViewController offset correction on web", () => {
  it("moves the DOM scroller by the growth above the first visible item, from where the DOM is", () => {
    // 50 items of 100px; item 20 is the first one in view. The last scroll event said 2000, but
    // the DOM scroller has since moved on to 2030 (scroll events lag the DOM on web).
    const node = { scrollTop: 2030, scrollLeft: 0 };
    const { controller, settle, scrollTo, scrollBy, unmount } = mountController(
      {
        items: 50,
        itemHeight: 100,
        scrolledTo: 2000,
        getScrollableNode: () => node,
      }
    );
    controller().computeFirstVisibleIndexForOffsetCorrection();

    // Item 5, above the view, grows by 100px.
    settle(sized([5], 200));

    expect(node.scrollTop).toBe(2130);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollBy).not.toHaveBeenCalled();

    // Nothing else changed: the correction is not applied a second time.
    settle([]);
    expect(node.scrollTop).toBe(2130);
    unmount();
  });

  it.each([
    ["has no getScrollableNode", undefined],
    ["returns no node", () => null],
  ])(
    "scrolls to the corrected offset when the scroll component %s",
    (_, getScrollableNode) => {
      // A custom scroll component (renderScrollComponent) may not expose its DOM scroller.
      const { controller, settle, scrollTo, unmount } = mountController({
        items: 50,
        itemHeight: 100,
        scrolledTo: 2000,
        getScrollableNode,
      });
      controller().computeFirstVisibleIndexForOffsetCorrection();

      settle(sized([5], 200));

      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(scrollTo).toHaveBeenCalledWith({ y: 2100, animated: false });
      unmount();
    }
  );

  describe("right to left", () => {
    const wasRTL = I18nManager.isRTL;
    beforeEach(() => {
      I18nManager.isRTL = true;
    });
    afterEach(() => {
      I18nManager.isRTL = wasRTL;
    });

    it("moves a horizontal scroller towards the end, which is leftwards, by the growth", () => {
      // In a right-to-left page the scroller starts at scrollLeft 0 and scrolling towards the
      // later items makes scrollLeft negative. Item 5 is the first in view.
      const node = { scrollTop: 0, scrollLeft: -500 };
      const { controller, settle, scrollTo, unmount } = mountController({
        items: 20,
        itemHeight: 100,
        scrolledTo: 500,
        horizontal: true,
        getScrollableNode: () => node,
      });
      controller().computeFirstVisibleIndexForOffsetCorrection();

      // Item 2, before the view, grows by 50px.
      settle(sizedAcross([2], 150));

      expect(node.scrollLeft).toBe(-550);
      expect(scrollTo).not.toHaveBeenCalled();
      unmount();
    });
  });
});

describe("FlashList offset correction on web while a scroll event is pending", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  const scrollEvent = (root: ReturnType<typeof render>, y: number) => {
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

  it("holds the item first in view at the DOM's offset when data changes before the scroll event arrives", () => {
    // 30 items of 100px, all rendered. The last scroll event said 998: item 9 (900 to 1000) is
    // still 2px in view there.
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
    const node = { scrollTop: 998, scrollLeft: 0 };
    (ref.current?.getNativeScrollRef() as any).getScrollableNode = () => node;
    scrollEvent(result, 998);

    // The DOM scroller then moves to 1002, so item 10 is first in view, but its scroll event has
    // not arrived yet when three items arrive after item 9, above item 10.
    node.scrollTop = 1002;
    result.setProps({
      data: [...data.slice(0, 10), 100, 101, 102, ...data.slice(10)],
    });

    // Item 10 is 300px lower, and the DOM scroller follows it.
    expect(node.scrollTop).toBe(1302);
  });
});

describe("FlashList scroller on web", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  const scrollerStyle = (list: React.ReactElement) => {
    const result = render(list);
    const style = StyleSheet.flatten(result.find(ScrollView)!.prop("style"));
    result.unmount();
    return style ?? {};
  };

  it("turns the browser's own scroll anchoring off on the scroller", () => {
    expect(
      scrollerStyle(
        <FlashList
          data={[0, 1, 2]}
          renderItem={({ item }) => <Text>{item}</Text>}
        />
      )
    ).toMatchObject({ overflowAnchor: "none" });
  });

  it("leaves the browser's scroll anchoring on when the list does not hold its position", () => {
    expect(
      scrollerStyle(
        <FlashList
          data={[0, 1, 2]}
          renderItem={({ item }) => <Text>{item}</Text>}
          maintainVisibleContentPosition={{ disabled: true }}
        />
      )
    ).not.toHaveProperty("overflowAnchor");
  });

  it("keeps a scroller style passed through overrideProps", () => {
    expect(
      scrollerStyle(
        <FlashList
          data={[0, 1, 2]}
          renderItem={({ item }) => <Text>{item}</Text>}
          overrideProps={{ style: { overflow: "visible" } }}
        />
      )
    ).toMatchObject({ overflowAnchor: "none", overflow: "visible" });
  });
});
