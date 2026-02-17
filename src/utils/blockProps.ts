import {
  BPUI_CONFIG_CHILD_PREFIX,
  BPUI_DATA_VERSION,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import type {
  BlockNode,
  BpuiData,
  BpuiInstanceData,
  ValueStorage,
  WidgetType,
} from "~/types/widgets";
import { createChildBlock, pullBlockString, pullBlockTree, updateBlockString } from "~/utils/roam";

type ReadBpuiResult = {
  block: BlockNode | null;
  configChildUid: string | null;
  data: BpuiData;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeBpuiData = (value: unknown): BpuiData => {
  if (!isObject(value)) {
    return { _meta: { version: BPUI_DATA_VERSION } };
  }
  const next = value as BpuiData;
  if (!next._meta?.version) {
    next._meta = { version: BPUI_DATA_VERSION };
  }
  return next;
};

const parseBpuiConfigChild = (childString: string): BpuiData => {
  const payload = childString.slice(BPUI_CONFIG_CHILD_PREFIX.length).trim();
  if (!payload) {
    return { _meta: { version: BPUI_DATA_VERSION } };
  }
  try {
    return normalizeBpuiData(JSON.parse(payload));
  } catch (e) {
    console.warn("bpui failed to parse config payload", e);
    return { _meta: { version: BPUI_DATA_VERSION } };
  }
};

const serializeBpuiConfig = (data: BpuiData): string =>
  `${BPUI_CONFIG_CHILD_PREFIX} ${JSON.stringify(data)}`;

const getConfigChild = (block: BlockNode | null): BlockNode | null =>
  block?.children.find((child) => child.string.startsWith(BPUI_CONFIG_CHILD_PREFIX)) || null;

const ensureWidgetBucket = (data: BpuiData, widgetType: WidgetType): Record<string, BpuiInstanceData> => {
  const bucket = data[widgetType];
  if (bucket && typeof bucket === "object") {
    return bucket as Record<string, BpuiInstanceData>;
  }
  const created: Record<string, BpuiInstanceData> = {};
  data[widgetType] = created;
  return created;
};

const writeBpuiData = async ({
  blockUid,
  configChildUid,
  data,
}: {
  blockUid: string;
  configChildUid: string | null;
  data: BpuiData;
}): Promise<string | null> => {
  const payload = serializeBpuiConfig(data);
  if (configChildUid) {
    await updateBlockString(configChildUid, payload);
    return configChildUid;
  }

  return createChildBlock({
    parentUid: blockUid,
    string: payload,
  });
};

export const readBpuiData = async (blockUid: string): Promise<ReadBpuiResult> => {
  const block = await pullBlockTree(blockUid);
  if (!block) {
    return {
      block: null,
      configChildUid: null,
      data: { _meta: { version: BPUI_DATA_VERSION } },
    };
  }

  const configChild = getConfigChild(block);
  const data = configChild
    ? parseBpuiConfigChild(configChild.string)
    : { _meta: { version: BPUI_DATA_VERSION } };

  return {
    block,
    configChildUid: configChild?.uid || null,
    data,
  };
};

export const readInstanceData = async ({
  blockUid,
  widgetType,
  instanceKey,
}: {
  blockUid: string;
  widgetType: WidgetType;
  instanceKey: string;
}): Promise<BpuiInstanceData> => {
  const { data } = await readBpuiData(blockUid);
  const bucket = (data[widgetType] || {}) as Record<string, BpuiInstanceData>;
  return bucket[instanceKey] || {};
};

export const upsertInstanceData = async ({
  blockUid,
  widgetType,
  instanceKey,
  updater,
}: {
  blockUid: string;
  widgetType: WidgetType;
  instanceKey: string;
  updater: (current: BpuiInstanceData) => BpuiInstanceData;
}): Promise<BpuiInstanceData> => {
  const { data, configChildUid } = await readBpuiData(blockUid);
  const bucket = ensureWidgetBucket(data, widgetType);
  const current = bucket[instanceKey] || {};
  const next = updater(current);
  bucket[instanceKey] = next;
  await writeBpuiData({
    blockUid,
    configChildUid,
    data,
  });
  return next;
};

export const writeInstanceSettings = async ({
  blockUid,
  widgetType,
  instanceKey,
  settings,
}: {
  blockUid: string;
  widgetType: WidgetType;
  instanceKey: string;
  settings: Record<string, unknown>;
}): Promise<void> => {
  await upsertInstanceData({
    blockUid,
    widgetType,
    instanceKey,
    updater: (current) => ({
      ...current,
      settings,
    }),
  });
};

export const resetInstanceSettings = async ({
  blockUid,
  widgetType,
  instanceKey,
}: {
  blockUid: string;
  widgetType: WidgetType;
  instanceKey: string;
}): Promise<void> => {
  await upsertInstanceData({
    blockUid,
    widgetType,
    instanceKey,
    updater: (current) => {
      const next = { ...current };
      delete next.settings;
      return next;
    },
  });
};

const parseRawValue = <T>(value: string, fallback: T): T => {
  if (typeof fallback === "number") {
    const parsed = Number(value);
    return (Number.isNaN(parsed) ? fallback : (parsed as T)) as T;
  }
  if (typeof fallback === "boolean") {
    return (value.trim().toLowerCase() === "true") as T;
  }
  return value as T;
};

const serializeRawValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  return JSON.stringify(value);
};

export const resolveEffectiveSettings = ({
  widgetType,
  instanceData,
  globalDefaults,
}: {
  widgetType: WidgetType;
  instanceData: BpuiInstanceData;
  globalDefaults: Record<string, unknown>;
}): Record<string, unknown> => ({
  ...(WIDGET_DEFAULTS[widgetType] || {}),
  ...globalDefaults,
  ...(instanceData.settings || {}),
});

export const readInstanceValue = async <T>({
  fallback,
  instanceData,
}: {
  fallback: T;
  instanceData: BpuiInstanceData;
}): Promise<T> => {
  if (instanceData.valueStorage === "child" && typeof instanceData.valueChildUid === "string") {
    const raw = await pullBlockString(instanceData.valueChildUid);
    return parseRawValue<T>(raw, fallback);
  }

  const value = instanceData.value;
  if (value === undefined || value === null) {
    return fallback;
  }
  return value as T;
};

export const writeInstanceValue = async ({
  blockUid,
  widgetType,
  instanceKey,
  value,
  valueStorage,
  hideValueChild,
}: {
  blockUid: string;
  widgetType: WidgetType;
  instanceKey: string;
  value: unknown;
  valueStorage: ValueStorage;
  hideValueChild: boolean;
}): Promise<void> => {
  const { data, configChildUid } = await readBpuiData(blockUid);
  const bucket = ensureWidgetBucket(data, widgetType);
  const current = bucket[instanceKey] || {};

  if (valueStorage === "child") {
    const childUid =
      current.valueChildUid ||
      (await createChildBlock({
        parentUid: blockUid,
        string: serializeRawValue(value),
      }));

    if (childUid) {
      await updateBlockString(childUid, serializeRawValue(value));
    }

    bucket[instanceKey] = {
      ...current,
      valueStorage,
      valueChildUid: childUid || undefined,
      hideValueChild,
      value,
    };
  } else {
    bucket[instanceKey] = {
      ...current,
      valueStorage,
      hideValueChild,
      value,
    };
  }

  await writeBpuiData({
    blockUid,
    configChildUid,
    data,
  });
};

export const collectHiddenValueChildUids = (data: BpuiData): string[] => {
  const hiddenUids: string[] = [];
  Object.keys(data).forEach((key) => {
    if (key === "_meta") {
      return;
    }
    const instances = data[key as WidgetType] || {};
    Object.values(instances).forEach((instance) => {
      if (
        instance?.valueStorage === "child" &&
        instance?.hideValueChild &&
        typeof instance.valueChildUid === "string" &&
        instance.valueChildUid.length
      ) {
        hiddenUids.push(instance.valueChildUid);
      }
    });
  });
  return hiddenUids;
};
