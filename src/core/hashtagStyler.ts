import type { TagStyleConfig, TagStyleOverrides } from "~/types/widgets";

const INTENT_CLASSES = ["bp3-intent-primary", "bp3-intent-success", "bp3-intent-warning", "bp3-intent-danger"];

const getTagTitle = (element: Element): string => {
  const text = (element.textContent || "").trim();
  return text.replace(/^#\[\[/, "").replace(/\]\]$/, "").replace(/^#/, "").trim();
};

const applyTagClasses = (element: Element, config: TagStyleConfig): void => {
  element.classList.add("bpui-tag", "bp3-tag");
  element.classList.remove(...INTENT_CLASSES);

  if (config.intent && config.intent !== "none") {
    element.classList.add(`bp3-intent-${config.intent}`);
  }
  if (config.minimal) {
    element.classList.add("bp3-minimal");
  } else {
    element.classList.remove("bp3-minimal");
  }
  if (config.round) {
    element.classList.add("bp3-round");
  } else {
    element.classList.remove("bp3-round");
  }
};

const ensureIcon = (element: Element, side: "left" | "right", iconName?: string): void => {
  const selector = `.bpui-tag-icon[data-side="${side}"]`;
  const existing = element.querySelector<HTMLElement>(selector);
  if (!iconName) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  const expectedClass = `bp3-icon bp3-icon-${iconName} bpui-tag-icon`;
  if (existing) {
    if (existing.className !== expectedClass) {
      existing.className = expectedClass;
    }
    return;
  }

  const icon = document.createElement("span");
  icon.className = expectedClass;
  icon.setAttribute("data-side", side);
  if (side === "left") {
    element.insertBefore(icon, element.firstChild);
  } else {
    element.appendChild(icon);
  }
};

const isHashtagReferenceElement = (element: Element): boolean => {
  if (element.classList.contains("rm-page-ref--tag")) {
    return true;
  }
  const text = (element.textContent || "").trim();
  return text.startsWith("#");
};

export const styleHashtags = ({
  defaults,
  overrides,
}: {
  defaults: TagStyleConfig;
  overrides: TagStyleOverrides;
}): void => {
  const candidates = Array.from(
    document.querySelectorAll(".rm-page-ref--tag, span.rm-page-ref, a.rm-page-ref"),
  );

  candidates.forEach((candidate) => {
    if (!isHashtagReferenceElement(candidate)) {
      return;
    }
    const pageTitle = getTagTitle(candidate);
    const override = overrides[pageTitle] || {};
    const config: TagStyleConfig = {
      ...defaults,
      ...override,
    };
    applyTagClasses(candidate, config);
    ensureIcon(candidate, "left", config.iconLeft || "");
    ensureIcon(candidate, "right", config.iconRight || "");
  });
};
