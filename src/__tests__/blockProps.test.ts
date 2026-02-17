import { collectHiddenValueChildUids } from "~/utils/blockProps";

describe("block props helpers", () => {
  test("collects only hidden child-storage value uids", () => {
    const hidden = collectHiddenValueChildUids({
      _meta: { version: 1 },
      "better-slider": {
        "better-slider:0": {
          valueStorage: "child",
          hideValueChild: true,
          valueChildUid: "abc123",
        },
        "better-slider:1": {
          valueStorage: "props",
          hideValueChild: true,
          valueChildUid: "nope",
        },
      },
      switch: {
        "switch:0": {
          valueStorage: "child",
          hideValueChild: false,
          valueChildUid: "nope-two",
        },
      },
    });

    expect(hidden).toEqual(["abc123"]);
  });
});

