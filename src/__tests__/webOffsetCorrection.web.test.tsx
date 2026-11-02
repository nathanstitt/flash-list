import React from "react";
import { ScrollView, Text } from "react-native";
import "@quilted/react-testing/matchers";
import { render } from "@quilted/react-testing";

import { FlashList } from "..";

import { mountController, sized } from "./helpers/mountController";

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
        scrollableNode: node,
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
});

describe("FlashList scroller on web", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it("turns the browser's own scroll anchoring off on the scroller", () => {
    const result = render(
      <FlashList
        data={[0, 1, 2]}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    );

    expect(result).toContainReactComponent(ScrollView, {
      style: expect.objectContaining({ overflowAnchor: "none" }),
    });
    result.unmount();
  });
});
