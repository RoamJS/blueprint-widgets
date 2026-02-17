import React, { useMemo } from "react";
import { Tab, Tabs } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { BlockNode } from "~/types/widgets";
import type { WidgetComponent } from "~/widgets/types";

const getTabChildren = (blockNode: BlockNode): BlockNode[] =>
  blockNode.children.filter((child) => !child.string.startsWith("bpui::"));

const RoamBlockPreview = ({ uid }: { uid: string }): JSX.Element => {
  const RoamBlock = (window as unknown as { roamAlphaAPI?: any }).roamAlphaAPI?.ui?.react?.Block;
  if (RoamBlock) {
    return <RoamBlock uid={uid} />;
  }
  return <div className="bpui-roam-fallback">Block: {uid}</div>;
};

const TabsWidget: WidgetComponent = ({
  modifierKey,
  blockNode,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
  onPatchInstance,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS.tabs,
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const tabChildren = useMemo(() => getTabChildren(blockNode), [blockNode]);
  const selectedTabId = `${instanceData.selectedTabId || tabChildren[0]?.uid || ""}`;

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-tabs-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES.tabs}
          fields={WIDGET_SETTING_FIELDS.tabs}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <Tabs
        id={`${blockNode.uid}:${selectedTabId}`}
        selectedTabId={selectedTabId}
        animate={!!settings.animate}
        vertical={!!settings.vertical}
        onChange={async (nextTabId) =>
          onPatchInstance({
            selectedTabId: `${nextTabId}`,
          })
        }
      >
        {tabChildren.map((child) => (
          <Tab
            key={child.uid}
            id={child.uid}
            title={child.string}
            panel={
              <div className="bpui-tabs-panel">
                {child.children.length ? (
                  child.children.map((descendant) => <RoamBlockPreview key={descendant.uid} uid={descendant.uid} />)
                ) : (
                  <span className="bpui-empty-tab-content">No content</span>
                )}
              </div>
            }
          />
        ))}
      </Tabs>
    </InlineWidgetShell>
  );
};

export default TabsWidget;

