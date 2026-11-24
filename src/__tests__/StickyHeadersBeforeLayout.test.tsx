import React from "react";
import { Text, View } from "react-native";
import "@quilted/react-testing/matchers";
import { render } from "@quilted/react-testing";

import { FlashList } from "..";

/**
 * A list can get its data while its container is hidden (on web, a screen
 * that stays mounted after the user leaves it). RecyclerView makes no layout
 * manager while hidden, so nothing that runs on mount may read a layout.
 */

let mockHidden = true;
jest.mock("../recyclerview/utils/measureLayout", () => {
  const originalModule = jest.requireActual(
    "../recyclerview/utils/measureLayout"
  );
  return {
    ...originalModule,
    isViewHidden: jest.fn(() => mockHidden),
    measureParentSize: jest.fn(() => ({ width: 400, height: 900 })),
    measureFirstChildLayout: jest.fn(() => ({
      x: 0,
      y: 0,
      width: 400,
      height: 900,
    })),
    measureItemLayout: jest.fn(() => ({
      x: 0,
      y: 0,
      width: 400,
      height: 50,
    })),
  };
});

const data = Array.from({ length: 30 }, (_, index) => index);

const renderList = (onChangeStickyIndex: jest.Mock) =>
  render(
    <FlashList
      data={data}
      stickyHeaderIndices={[0, 10, 20]}
      onChangeStickyIndex={onChangeStickyIndex}
      renderItem={({ item }) => <Text>{String(item)}</Text>}
    />
  );

// The outer container is the only view that RecyclerView marks as not
// collapsable; its onLayout is how the platform reports that it is shown.
const showContainer = (root: ReturnType<typeof renderList>) => {
  mockHidden = false;
  const container = root.findWhere(
    (node) =>
      node.type === View &&
      (node.props as { collapsable?: boolean }).collapsable === false
  )!;
  root.act(() => {
    container.trigger("onLayout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 900 } },
    });
  });
};

beforeEach(() => {
  mockHidden = true;
});

describe("sticky headers in a container that is hidden on mount", () => {
  it("mounts with data and no layout manager without a throw", () => {
    const onChangeStickyIndex = jest.fn();
    let root: ReturnType<typeof renderList> | undefined;

    expect(() => {
      root = renderList(onChangeStickyIndex);
    }).not.toThrow();
    expect(onChangeStickyIndex).not.toHaveBeenCalled();

    root?.unmount();
  });

  it("computes the sticky header after the container is shown", () => {
    const onChangeStickyIndex = jest.fn();
    const root = renderList(onChangeStickyIndex);

    showContainer(root);

    expect(onChangeStickyIndex).toHaveBeenCalledWith(0, -1);

    root.unmount();
  });
});
