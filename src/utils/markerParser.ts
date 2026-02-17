import type { WidgetMarker, WidgetType } from "~/types/widgets";

export type ParsedIconParams = {
  icon?: string;
  intent?: string;
  size?: number;
};

const MARKER_REGEX = /{{([^{}]+)}}/g;

const isNumericInputAlias = (inner: string): boolean => {
  const normalized = inner.trim().toLowerCase();
  return normalized === "numeric-input" || normalized === "numeric input" || normalized.startsWith("numeric-input:");
};

const detectWidgetType = (inner: string): WidgetType | null => {
  const normalized = inner.trim().toLowerCase();
  if (normalized === "radio") {
    return "radio";
  }
  if (normalized === "better-slider") {
    return "better-slider";
  }
  if (normalized === "switch") {
    return "switch";
  }
  if (isNumericInputAlias(normalized)) {
    return "numeric-input";
  }
  if (normalized === "tabs") {
    return "tabs";
  }
  if (normalized === "progress") {
    return "progress";
  }
  if (normalized === "card") {
    return "card";
  }
  if (normalized.startsWith("icon:")) {
    return "icon";
  }
  return null;
};

export const parseIconParameters = (inner: string): ParsedIconParams => {
  const payload = inner.trim().slice("icon:".length).trim();
  if (!payload) {
    return {};
  }

  if (payload.includes("=")) {
    const tokens = payload.split(/\s+/).filter(Boolean);
    return tokens.reduce<ParsedIconParams>((acc, token) => {
      const [rawKey, ...valueParts] = token.split("=");
      const key = rawKey.trim().toLowerCase();
      const value = valueParts.join("=").trim();
      if (!value) {
        return acc;
      }
      if (key === "name" || key === "icon") {
        acc.icon = value;
      }
      if (key === "intent") {
        acc.intent = value;
      }
      if (key === "size") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          acc.size = parsed;
        }
      }
      return acc;
    }, {});
  }

  if (payload.includes("::")) {
    const [icon, intent, size] = payload.split("::").map((part) => part.trim());
    const parsedSize = Number(size);
    return {
      icon: icon || undefined,
      intent: intent || undefined,
      size: Number.isNaN(parsedSize) ? undefined : parsedSize,
    };
  }

  return { icon: payload };
};

const parseMarkerPayload = (type: WidgetType, inner: string): Record<string, unknown> => {
  if (type === "icon") {
    return parseIconParameters(inner);
  }

  if (type === "numeric-input") {
    const normalized = inner.trim().toLowerCase();
    if (normalized.startsWith("numeric-input:")) {
      const raw = inner.trim().slice("numeric-input:".length).trim();
      const value = Number(raw);
      if (!Number.isNaN(value)) {
        return { seedValue: value };
      }
    }
  }

  return {};
};

export const parseWidgetMarkers = (blockString: string): WidgetMarker[] => {
  const markerMatches = Array.from(blockString.matchAll(MARKER_REGEX));
  const counters: Partial<Record<WidgetType, number>> = {};

  return markerMatches
    .map((match) => {
      const inner = (match[1] || "").trim();
      const type = detectWidgetType(inner);
      if (!type) {
        return null;
      }

      const nextIndex = counters[type] || 0;
      counters[type] = nextIndex + 1;

      return {
        raw: match[0],
        inner,
        type,
        instanceIndex: nextIndex,
        instanceKey: `${type}:${nextIndex}`,
        parsed: parseMarkerPayload(type, inner),
      } as WidgetMarker;
    })
    .filter((marker): marker is WidgetMarker => !!marker);
};

