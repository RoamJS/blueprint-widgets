import { parseIconParameters, parseWidgetMarkers } from "~/utils/markerParser";

describe("marker parser", () => {
  test("assigns stable instance indexes per widget type", () => {
    const markers = parseWidgetMarkers(
      "A {{better-slider}} B {{better-slider}} C {{numeric-input}} D {{better-slider}}",
    );
    expect(markers.map((m) => `${m.type}:${m.instanceIndex}`)).toEqual([
      "better-slider:0",
      "better-slider:1",
      "numeric-input:0",
      "better-slider:2",
    ]);
  });

  test("supports numeric-input alias and seeded value", () => {
    const markers = parseWidgetMarkers("{{numeric input}} {{numeric-input:42}}");
    expect(markers[0]?.type).toBe("numeric-input");
    expect(markers[1]?.type).toBe("numeric-input");
    expect(markers[1]?.parsed.seedValue).toBe(42);
  });

  test("parses icon shorthand and named syntax", () => {
    expect(parseIconParameters("icon:search::16")).toEqual({
      icon: "search",
      intent: undefined,
      size: 16,
    });
    expect(parseIconParameters("icon:name=search intent=primary size=20")).toEqual({
      icon: "search",
      intent: "primary",
      size: 20,
    });
  });
});

