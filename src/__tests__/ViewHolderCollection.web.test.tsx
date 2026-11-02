import React, { createRef, useEffect } from "react";
import { Text } from "react-native";
import "@quilted/react-testing/matchers";
import { render } from "@quilted/react-testing";

import {
  ViewHolderCollection,
  ViewHolderCollectionRef,
} from "../recyclerview/ViewHolderCollection";

// The web platform config, as react-native-web's bundler resolves it.
jest.mock("../native/config/PlatformHelper", () =>
  jest.requireActual("../native/config/PlatformHelper.web")
);

const data = ["a", "b", "c", "d", "e"];

const Row = ({ value, onMount }: { value: string; onMount: () => void }) => {
  useEffect(onMount, [onMount]);
  return <Text>{value}</Text>;
};

const renderCollection = (
  renderStack: Map<string, { index: number }>,
  onMount: () => void
) =>
  render(
    <ViewHolderCollection
      data={data}
      renderStack={renderStack}
      getLayout={(index) => ({ x: 0, y: index * 100, width: 100, height: 100 })}
      viewHolderCollectionRef={createRef<ViewHolderCollectionRef>()}
      refHolder={new Map()}
      onSizeChanged={jest.fn()}
      renderItem={({ item }) => <Row value={item} onMount={onMount} />}
      extraData={undefined}
      getChildContainerLayout={() => ({ width: 100, height: 500 })}
      onCommitLayoutEffect={jest.fn()}
      onCommitEffect={jest.fn()}
      horizontal={false}
      getAdjustmentMargin={() => 0}
      currentStickyIndex={-1}
      hideStickyHeaderRelatedCell={false}
      isInLastRow={() => false}
      inverted={false}
    />
  );

const renderedOrder = (result: ReturnType<typeof render>) =>
  result.findAll(Text).map((text) => text.prop("children"));

describe("ViewHolderCollection on web", () => {
  it("renders the view holders in data order, whatever order their keys were made in", () => {
    // Recycling hands a key made for one index to another, so the render stack's key order
    // stops matching the data. Browsers read and Tab through the DOM in its order.
    const renderStack = new Map([
      ["key-1", { index: 3 }],
      ["key-2", { index: 1 }],
      ["key-3", { index: 2 }],
    ]);
    const result = renderCollection(renderStack, jest.fn());

    expect(renderedOrder(result)).toEqual(["b", "c", "d"]);
  });

  it("keeps every view holder mounted when recycling moves it", () => {
    const onMount = jest.fn();
    const renderStack = new Map([
      ["key-1", { index: 0 }],
      ["key-2", { index: 1 }],
      ["key-3", { index: 2 }],
    ]);
    const result = renderCollection(renderStack, onMount);
    expect(onMount).toHaveBeenCalledTimes(3);

    // Scrolling down twice: the key of the item that left at the top shows the next item below.
    renderStack.get("key-1")!.index = 3;
    result.setProps({ renderStack: new Map(renderStack) });
    expect(renderedOrder(result)).toEqual(["b", "c", "d"]);
    renderStack.get("key-2")!.index = 4;
    result.setProps({ renderStack: new Map(renderStack) });
    expect(renderedOrder(result)).toEqual(["c", "d", "e"]);

    // Scrolling back up: the key of the item that left at the bottom shows the item above the top.
    renderStack.get("key-2")!.index = 1;
    result.setProps({ renderStack: new Map(renderStack) });
    expect(renderedOrder(result)).toEqual(["b", "c", "d"]);

    expect(onMount).toHaveBeenCalledTimes(3);
  });
});
