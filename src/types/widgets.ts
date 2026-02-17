export type WidgetType =
  | "radio"
  | "better-slider"
  | "switch"
  | "numeric-input"
  | "tabs"
  | "progress"
  | "icon"
  | "card";

export type ValueStorage = "props" | "child";

export type ModifierKey = "none" | "alt" | "ctrl" | "shift" | "meta";

export type WidgetMarker = {
  raw: string;
  inner: string;
  type: WidgetType;
  instanceIndex: number;
  instanceKey: string;
  parsed: Record<string, unknown>;
};

export type BlockNode = {
  uid: string;
  string: string;
  order: number;
  children: BlockNode[];
};

export type BpuiInstanceData = {
  settings?: Record<string, unknown>;
  value?: unknown;
  selectedValue?: string;
  selectedTabId?: string;
  valueStorage?: ValueStorage;
  valueChildUid?: string;
  hideValueChild?: boolean;
  [key: string]: unknown;
};

export type BpuiData = Partial<Record<WidgetType, Record<string, BpuiInstanceData>>> & {
  _meta?: {
    version: number;
  };
};

export type SettingFieldType = "boolean" | "number" | "text" | "select";

export type SettingField = {
  key: string;
  label: string;
  type: SettingFieldType;
  description?: string;
  options?: string[];
};

export type TagStyleConfig = {
  intent?: "none" | "primary" | "success" | "warning" | "danger";
  minimal?: boolean;
  round?: boolean;
  iconLeft?: string;
  iconRight?: string;
};

export type TagStyleOverrides = Record<string, TagStyleConfig>;

