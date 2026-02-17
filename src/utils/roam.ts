import type { BlockNode } from "~/types/widgets";

type RoamEntity = Record<string, unknown>;

const BLOCK_UID_PREFIX = "block-input-";

const readEntityValue = <T>(entity: RoamEntity | undefined, keys: string[], fallback: T): T => {
  for (const key of keys) {
    const value = entity?.[key] as T | undefined;
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return fallback;
};

const normalizeBlockTree = (entity: RoamEntity | undefined): BlockNode | null => {
  if (!entity) {
    return null;
  }

  const uid = readEntityValue<string>(entity, [":block/uid", "uid"], "");
  if (!uid) {
    return null;
  }

  const string = readEntityValue<string>(entity, [":block/string", "string"], "");
  const order = readEntityValue<number>(entity, [":block/order", "order"], 0);
  const childrenRaw = readEntityValue<RoamEntity[]>(entity, [":block/children", "children"], []);

  const children = childrenRaw
    .map((child) => normalizeBlockTree(child))
    .filter((child): child is BlockNode => !!child)
    .sort((a, b) => a.order - b.order);

  return {
    uid,
    string,
    order,
    children,
  };
};

const getRoamApi = (): any => (window as unknown as { roamAlphaAPI?: any }).roamAlphaAPI;

const pullWithFallback = async (pattern: string, eid: string): Promise<RoamEntity | null> => {
  const api = getRoamApi();
  if (!api) {
    return null;
  }

  if (api.data?.pull) {
    return (await Promise.resolve(api.data.pull(pattern, [":block/uid", eid]))) as RoamEntity;
  }

  if (api.pull) {
    return (await Promise.resolve(api.pull(pattern, [":block/uid", eid]))) as RoamEntity;
  }

  return null;
};

const updateBlockWithFallback = async (uid: string, string: string): Promise<void> => {
  const api = getRoamApi();
  if (!api) {
    return;
  }

  if (api.data?.block?.update) {
    await Promise.resolve(api.data.block.update({ block: { uid, string } }));
    return;
  }

  if (api.updateBlock) {
    await Promise.resolve(api.updateBlock({ block: { uid, string } }));
  }
};

const createBlockWithFallback = async ({
  parentUid,
  order,
  string,
  uid,
}: {
  parentUid: string;
  order: number | "last";
  string: string;
  uid: string;
}): Promise<void> => {
  const api = getRoamApi();
  if (!api) {
    return;
  }

  const location = { "parent-uid": parentUid, order };
  const block = { uid, string };

  if (api.data?.block?.create) {
    await Promise.resolve(api.data.block.create({ location, block }));
    return;
  }

  if (api.createBlock) {
    await Promise.resolve(api.createBlock({ location, block }));
  }
};

export const getBlockUidFromElement = (element: Element): string | null => {
  const blockTextElement = element.matches(`.rm-block-text[id^="${BLOCK_UID_PREFIX}"]`)
    ? element
    : element.closest(`.rm-block-text[id^="${BLOCK_UID_PREFIX}"]`);
  const id = blockTextElement?.id || "";
  return id.startsWith(BLOCK_UID_PREFIX) ? id.slice(BLOCK_UID_PREFIX.length) : null;
};

export const pullBlockTree = async (uid: string): Promise<BlockNode | null> => {
  const entity = await pullWithFallback(
    "[:block/uid :block/string :block/order {:block/children ...}]",
    uid,
  );
  return normalizeBlockTree(entity || undefined);
};

export const pullBlockString = async (uid: string): Promise<string> => {
  const entity = await pullWithFallback("[:block/string]", uid);
  return readEntityValue<string>(entity || undefined, [":block/string", "string"], "");
};

export const updateBlockString = async (uid: string, string: string): Promise<void> => {
  await updateBlockWithFallback(uid, string);
};

export const createChildBlock = async ({
  parentUid,
  string,
  order = "last",
}: {
  parentUid: string;
  string: string;
  order?: number | "last";
}): Promise<string | null> => {
  const api = getRoamApi();
  if (!api) {
    return null;
  }

  const generatedUid =
    typeof api.util?.generateUID === "function"
      ? (api.util.generateUID() as string)
      : Math.random().toString(36).slice(2, 11);

  await createBlockWithFallback({
    parentUid,
    order,
    string,
    uid: generatedUid,
  });

  return generatedUid;
};

export const runRoamQueryCount = async (query: string): Promise<number> => {
  const api = getRoamApi();
  if (!api?.data?.roamQuery || !query?.trim()) {
    return 0;
  }

  try {
    const result = (await Promise.resolve(
      api.data.roamQuery({
        query,
        limit: null,
      }),
    )) as { total?: number; results?: unknown[] };
    if (typeof result?.total === "number") {
      return result.total;
    }
    if (Array.isArray(result?.results)) {
      return result.results.length;
    }
    return 0;
  } catch (e) {
    console.warn("bpui progress query failed", e);
    return 0;
  }
};

