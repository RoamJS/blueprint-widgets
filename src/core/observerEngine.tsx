import React from "react";
import ReactDOM from "react-dom";
import createBlockObserver from "roamjs-components/dom/createBlockObserver";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getUids from "roamjs-components/dom/getUids";
import { WIDGET_DEFAULTS } from "~/constants/defaults";
import BlockWidgetsHost from "~/components/BlockWidgetsHost";
import {
  getModifierKeyForSettings,
  getTagDefaults,
  getTagOverrides,
  getWidgetGlobalDefaults,
  shouldReplaceTodosWithSwitch,
} from "~/core/settings";
import { styleHashtags } from "~/core/hashtagStyler";
import { cleanupTodoHijack, reconcileTodoHijack } from "~/core/todoHijack";
import type { WidgetMarker, WidgetType } from "~/types/widgets";
import { collectHiddenValueChildUids, readBpuiData } from "~/utils/blockProps";
import { parseWidgetMarkers } from "~/utils/markerParser";

type ObserverEngine = {
  start: () => void;
  refresh: () => void;
  stop: () => void;
};

type BlockRecord = {
  element: HTMLDivElement;
  host: HTMLSpanElement | null;
  signature: string;
};

const HIDDEN_WIDGET_BUTTON_ATTR = "data-bpui-hidden-widget-button";

const normalizeButtonText = (value: string): string => {
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    return trimmed.slice(2, -2).trim();
  }
  return trimmed;
};

const doesButtonMatchWidgetType = ({
  normalizedButtonText,
  widgetType,
}: {
  normalizedButtonText: string;
  widgetType: WidgetType;
}): boolean => {
  if (widgetType === "icon") {
    return normalizedButtonText === "icon" || normalizedButtonText.startsWith("icon:");
  }

  if (widgetType === "numeric-input") {
    return (
      normalizedButtonText === "numeric-input" ||
      normalizedButtonText === "numeric input" ||
      normalizedButtonText.startsWith("numeric-input:")
    );
  }

  const expected = widgetType;
  const expectedWithSpaces = widgetType.replace("-", " ");
  return (
    normalizedButtonText === expected ||
    normalizedButtonText === expectedWithSpaces ||
    normalizedButtonText.startsWith(`${expected}:`)
  );
};

const hideWidgetButtonsForBlock = ({
  blockElement,
  markers,
}: {
  blockElement: HTMLDivElement;
  markers: WidgetMarker[];
}): void => {
  const markerTypes = Array.from(new Set(markers.map((marker) => marker.type)));
  const buttons = Array.from(blockElement.querySelectorAll<HTMLButtonElement>("button.bp3-button"));

  buttons.forEach((button) => {
    if (button.closest(".bpui-inline-host")) {
      return;
    }

    const normalized = normalizeButtonText(button.innerText || button.textContent || "");
    const shouldHide = markerTypes.some((widgetType) =>
      doesButtonMatchWidgetType({
        normalizedButtonText: normalized,
        widgetType,
      }),
    );

    if (!shouldHide) {
      return;
    }

    button.setAttribute(HIDDEN_WIDGET_BUTTON_ATTR, "true");
    button.style.display = "none";
  });
};

const restoreWidgetButtonsForBlock = (blockElement: HTMLDivElement): void => {
  const buttons = Array.from(
    blockElement.querySelectorAll<HTMLButtonElement>(`button[${HIDDEN_WIDGET_BUTTON_ATTR}="true"]`),
  );
  buttons.forEach((button) => {
    button.style.removeProperty("display");
    button.removeAttribute(HIDDEN_WIDGET_BUTTON_ATTR);
  });
};

const blockContainsTodoCheckbox = (blockElement: HTMLDivElement): boolean =>
  !!blockElement.querySelector("label.check-container input[type='checkbox']");

const unmountHost = (host: HTMLSpanElement | null): void => {
  if (!host) {
    return;
  }
  ReactDOM.unmountComponentAtNode(host);
  host.remove();
};

const hideChildBlock = (childUid: string, hidden: boolean): void => {
  const blockText = document.getElementById(`block-input-${childUid}`);
  const blockRoot = blockText?.closest(".roam-block") || blockText?.closest(".roam-block-container");
  if (!blockRoot) {
    return;
  }
  if (hidden) {
    blockRoot.classList.add("bpui-hidden-value-child");
  } else {
    blockRoot.classList.remove("bpui-hidden-value-child");
  }
};

const getWidgetDefaultsMap = (extensionAPI: any): Record<WidgetType, Record<string, unknown>> =>
  Object.keys(WIDGET_DEFAULTS).reduce((acc, widgetType) => {
    acc[widgetType as WidgetType] = getWidgetGlobalDefaults(extensionAPI, widgetType as WidgetType);
    return acc;
  }, {} as Record<WidgetType, Record<string, unknown>>);

const getInlineMountTarget = ({
  blockElement,
  blockUid,
}: {
  blockElement: HTMLDivElement;
  blockUid: string;
}): HTMLElement => {
  const preferred = blockElement.querySelector<HTMLElement>(
    `.rm-block-text, .rm-block__input`,
  );
  if (preferred) {
    return preferred;
  }

  const idMatch = blockElement.querySelector<HTMLElement>(`[id$="${blockUid}"]`);
  return idMatch || blockElement;
};

const getOrCreateHost = ({
  record,
  blockUid,
}: {
  record: BlockRecord;
  blockUid: string;
}): HTMLSpanElement => {
  const target = getInlineMountTarget({
    blockElement: record.element,
    blockUid,
  });

  const existing = record.host;
  if (existing && existing.isConnected) {
    if (!target.contains(existing)) {
      target.appendChild(existing);
    }
    return existing;
  }

  const reused = target.querySelector<HTMLSpanElement>(".bpui-inline-host");
  if (reused) {
    record.host = reused;
    return reused;
  }

  const host = document.createElement("span");
  host.className = "bpui-inline-host";
  target.appendChild(host);
  record.host = host;
  return host;
};

const createObserverEngine = ({ extensionAPI }: { extensionAPI: any }): ObserverEngine => {
  const blockRecords = new Map<string, BlockRecord>();
  const dirtyBlockUids = new Set<string>();
  const hiddenValueChildren = new Set<string>();
  const observers: MutationObserver[] = [];

  let flushHandle = 0;
  let refreshAll = true;
  let isStopped = false;
  let todoDirty = true;
  let lastTodoHijackEnabled = false;

  const scheduleFlush = (): void => {
    if (flushHandle) {
      window.clearTimeout(flushHandle);
    }
    flushHandle = window.setTimeout(() => {
      void flush();
    }, 120);
  };

  const markDirty = (blockUid: string): void => {
    if (!blockUid) {
      return;
    }
    dirtyBlockUids.add(blockUid);
    scheduleFlush();
  };

  const flush = async (): Promise<void> => {
    if (isStopped) {
      return;
    }

    const modifierKey = getModifierKeyForSettings(extensionAPI);
    const replaceTodosWithSwitch = shouldReplaceTodosWithSwitch(extensionAPI);
    const widgetDefaults = getWidgetDefaultsMap(extensionAPI);
    const tagDefaults = getTagDefaults(extensionAPI);
    const tagOverrides = getTagOverrides(extensionAPI);

    const isRefreshAll = refreshAll;
    const targetUids = isRefreshAll ? Array.from(blockRecords.keys()) : Array.from(dirtyBlockUids);
    dirtyBlockUids.clear();
    refreshAll = false;

    const nextHiddenValueChildren = new Set<string>();
    const globalSignature = JSON.stringify({
      modifierKey,
      widgetDefaults,
    });

    for (const blockUid of targetUids) {
      const record = blockRecords.get(blockUid);
      if (!record) {
        continue;
      }
      if (!document.body.contains(record.element)) {
        restoreWidgetButtonsForBlock(record.element);
        unmountHost(record.host);
        blockRecords.delete(blockUid);
        continue;
      }

      let blockResult: Awaited<ReturnType<typeof readBpuiData>>;
      try {
        blockResult = await readBpuiData(blockUid);
      } catch (e) {
        console.warn("bpui failed to read block data", blockUid, e);
        continue;
      }

      const { block, data, configChildUid } = blockResult;
      if (!block) {
        continue;
      }

      const markers = parseWidgetMarkers(block.string);
      collectHiddenValueChildUids(data).forEach((uid) => nextHiddenValueChildren.add(uid));
      if (configChildUid) {
        nextHiddenValueChildren.add(configChildUid);
      }

      if (!markers.length) {
        restoreWidgetButtonsForBlock(record.element);
        unmountHost(record.host);
        record.host = null;
        record.signature = "";
        continue;
      }

      hideWidgetButtonsForBlock({
        blockElement: record.element,
        markers,
      });

      const instanceSnapshots = markers.map((marker) => ({
        type: marker.type,
        instanceKey: marker.instanceKey,
        parsed: marker.parsed,
        data: ((data[marker.type] || {}) as Record<string, unknown>)[marker.instanceKey] || {},
      }));
      const nextSignature = JSON.stringify({
        globalSignature,
        blockString: block.string,
        markers: instanceSnapshots,
      });

      if (record.signature === nextSignature && record.host && record.host.isConnected) {
        continue;
      }

      const host = getOrCreateHost({
        record,
        blockUid,
      });

      ReactDOM.render(
        <BlockWidgetsHost
          blockUid={blockUid}
          blockNode={block}
          bpuiData={data}
          markers={markers}
          modifierKey={modifierKey}
          widgetDefaults={widgetDefaults}
          refresh={() => {
            refreshAll = true;
            scheduleFlush();
          }}
        />,
        host,
      );
      record.signature = nextSignature;
    }

    Array.from(blockRecords.entries()).forEach(([blockUid, record]) => {
      if (document.body.contains(record.element)) {
        return;
      }
      restoreWidgetButtonsForBlock(record.element);
      unmountHost(record.host);
      blockRecords.delete(blockUid);
    });

    Array.from(hiddenValueChildren).forEach((uid) => {
      if (!nextHiddenValueChildren.has(uid)) {
        hideChildBlock(uid, false);
      }
    });
    Array.from(nextHiddenValueChildren).forEach((uid) => hideChildBlock(uid, true));

    hiddenValueChildren.clear();
    Array.from(nextHiddenValueChildren).forEach((uid) => hiddenValueChildren.add(uid));

    styleHashtags({
      defaults: tagDefaults,
      overrides: tagOverrides,
    });
    const shouldReconcileTodos =
      replaceTodosWithSwitch !== lastTodoHijackEnabled || todoDirty || isRefreshAll;
    if (shouldReconcileTodos) {
      reconcileTodoHijack({
        enabled: replaceTodosWithSwitch,
      });
      lastTodoHijackEnabled = replaceTodosWithSwitch;
      todoDirty = false;
    }
  };

  const onBlockLoad = (blockElement: HTMLDivElement): void => {
    const { blockUid } = getUids(blockElement);
    if (!blockUid) {
      return;
    }

    const existing = blockRecords.get(blockUid);
    blockRecords.set(blockUid, {
      element: blockElement,
      host: existing?.host || null,
      signature: existing?.signature || "",
    });
    if (blockContainsTodoCheckbox(blockElement)) {
      todoDirty = true;
    }
    markDirty(blockUid);
  };

  const onBlockUnload = (blockElement: HTMLDivElement): void => {
    const { blockUid } = getUids(blockElement);
    if (!blockUid) {
      return;
    }
    const existing = blockRecords.get(blockUid);
    if (!existing || existing.element !== blockElement) {
      return;
    }
    if (blockContainsTodoCheckbox(blockElement)) {
      todoDirty = true;
    }
    restoreWidgetButtonsForBlock(existing.element);
    unmountHost(existing.host);
    blockRecords.delete(blockUid);
  };

  const start = (): void => {
    isStopped = false;
    refreshAll = true;

    const [blockObserver] = createBlockObserver({
      onBlockLoad,
      onBlockUnload,
    });
    observers.push(blockObserver);

    const buttonObserver = createHTMLObserver({
      useBody: true,
      tag: "BUTTON",
      className: "bp3-button",
      callback: (buttonElement) => {
        const button = buttonElement as HTMLButtonElement;
        if (button.closest(".bpui-inline-host")) {
          return;
        }
        const blockElement = button.closest(".roam-block") as HTMLDivElement | null;
        if (!blockElement) {
          return;
        }
        const { blockUid } = getUids(blockElement);
        if (blockUid) {
          markDirty(blockUid);
        }
      },
      removeCallback: (buttonElement) => {
        const button = buttonElement as HTMLButtonElement;
        if (button.closest(".bpui-inline-host")) {
          return;
        }
        const blockElement = button.closest(".roam-block") as HTMLDivElement | null;
        if (!blockElement) {
          return;
        }
        const { blockUid } = getUids(blockElement);
        if (blockUid) {
          markDirty(blockUid);
        }
      },
    });
    observers.push(buttonObserver);

    scheduleFlush();
  };

  const refresh = (): void => {
    refreshAll = true;
    scheduleFlush();
  };

  const stop = (): void => {
    isStopped = true;
    if (flushHandle) {
      window.clearTimeout(flushHandle);
      flushHandle = 0;
    }
    observers.forEach((observer) => observer.disconnect());
    observers.length = 0;
    Array.from(blockRecords.values()).forEach((record) => unmountHost(record.host));
    Array.from(blockRecords.values()).forEach((record) => restoreWidgetButtonsForBlock(record.element));
    blockRecords.clear();
    dirtyBlockUids.clear();
    Array.from(hiddenValueChildren).forEach((uid) => hideChildBlock(uid, false));
    hiddenValueChildren.clear();
    todoDirty = false;
    lastTodoHijackEnabled = false;
    cleanupTodoHijack();
  };

  return {
    start,
    refresh,
    stop,
  };
};

export default createObserverEngine;
