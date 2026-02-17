import type { BlockNode, BpuiInstanceData, ModifierKey, WidgetMarker, WidgetType } from "~/types/widgets";

export type WidgetComponentProps = {
  blockUid: string;
  blockNode: BlockNode;
  marker: WidgetMarker;
  modifierKey: ModifierKey;
  globalDefaults: Record<string, unknown>;
  instanceData: BpuiInstanceData;
  onSaveSettings: (settings: Record<string, unknown>) => Promise<void>;
  onResetSettings: () => Promise<void>;
  onPatchInstance: (patch: Partial<BpuiInstanceData>) => Promise<void>;
  onPersistValue: (value: unknown, valueStorage: "props" | "child", hideValueChild: boolean) => Promise<void>;
  refresh: () => void;
};

export type WidgetComponent = (props: WidgetComponentProps) => JSX.Element;

export type WidgetRegistry = Record<WidgetType, WidgetComponent>;

