import React, { useEffect, useMemo, useState } from "react";
import widgetRegistry from "~/core/widgetRegistry";
import type { BlockNode, BpuiData, BpuiInstanceData, ModifierKey, WidgetMarker, WidgetType } from "~/types/widgets";
import { resetInstanceSettings, upsertInstanceData, writeInstanceSettings, writeInstanceValue } from "~/utils/blockProps";

type BlockWidgetsHostProps = {
  blockUid: string;
  blockNode: BlockNode;
  bpuiData: BpuiData;
  markers: WidgetMarker[];
  modifierKey: ModifierKey;
  widgetDefaults: Record<WidgetType, Record<string, unknown>>;
  refresh: () => void;
};

const BlockWidgetsHost = ({
  blockUid,
  blockNode,
  bpuiData,
  markers,
  modifierKey,
  widgetDefaults,
  refresh,
}: BlockWidgetsHostProps): JSX.Element => {
  const [localData, setLocalData] = useState<BpuiData>(bpuiData);

  useEffect(() => {
    setLocalData(bpuiData);
  }, [bpuiData]);

  const markerRows = useMemo(
    () =>
      markers.map((marker) => {
        const bucket = (localData[marker.type] || {}) as Record<string, BpuiInstanceData>;
        const instanceData = bucket[marker.instanceKey] || {};
        return {
          marker,
          instanceData,
        };
      }),
    [markers, localData],
  );

  const updateLocalInstance = (
    widgetType: WidgetType,
    instanceKey: string,
    updater: (current: BpuiInstanceData) => BpuiInstanceData,
  ): void => {
    setLocalData((current) => {
      const next = { ...current };
      const bucket = { ...((next[widgetType] || {}) as Record<string, BpuiInstanceData>) };
      const existing = bucket[instanceKey] || {};
      bucket[instanceKey] = updater(existing);
      next[widgetType] = bucket;
      return next;
    });
  };

  return (
    <span className="bpui-widget-row">
      {markerRows.map(({ marker, instanceData }) => {
        const WidgetComponent = widgetRegistry[marker.type];
        if (!WidgetComponent) {
          return null;
        }

        return (
          <WidgetComponent
            key={`${blockUid}:${marker.type}:${marker.instanceKey}`}
            blockUid={blockUid}
            blockNode={blockNode}
            marker={marker}
            modifierKey={modifierKey}
            globalDefaults={widgetDefaults[marker.type] || {}}
            instanceData={instanceData}
            onSaveSettings={async (settings) => {
              updateLocalInstance(marker.type, marker.instanceKey, (current) => ({
                ...current,
                settings,
              }));
              await writeInstanceSettings({
                blockUid,
                widgetType: marker.type,
                instanceKey: marker.instanceKey,
                settings,
              });
              refresh();
            }}
            onResetSettings={async () => {
              updateLocalInstance(marker.type, marker.instanceKey, (current) => {
                const next = { ...current };
                delete next.settings;
                return next;
              });
              await resetInstanceSettings({
                blockUid,
                widgetType: marker.type,
                instanceKey: marker.instanceKey,
              });
              refresh();
            }}
            onPatchInstance={async (patch) => {
              updateLocalInstance(marker.type, marker.instanceKey, (current) => ({
                ...current,
                ...patch,
              }));
              await upsertInstanceData({
                blockUid,
                widgetType: marker.type,
                instanceKey: marker.instanceKey,
                updater: (current) => ({
                  ...current,
                  ...patch,
                }),
              });
              refresh();
            }}
            onPersistValue={async (value, valueStorage, hideValueChild) => {
              updateLocalInstance(marker.type, marker.instanceKey, (current) => ({
                ...current,
                value,
                valueStorage,
                hideValueChild,
              }));
              await writeInstanceValue({
                blockUid,
                widgetType: marker.type,
                instanceKey: marker.instanceKey,
                value,
                valueStorage,
                hideValueChild,
              });
              refresh();
            }}
            refresh={refresh}
          />
        );
      })}
    </span>
  );
};

export default BlockWidgetsHost;

