import React, { useMemo } from "react";
import { Card, Elevation } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { WidgetComponent } from "~/widgets/types";

const RoamBlockPreview = ({ uid }: { uid: string }): JSX.Element => {
  const RoamBlock = (window as unknown as { roamAlphaAPI?: any }).roamAlphaAPI?.ui?.react?.Block;
  if (RoamBlock) {
    return <RoamBlock uid={uid} />;
  }
  return <div className="bpui-roam-fallback">Block: {uid}</div>;
};

const toElevation = (value: unknown): Elevation => {
  const parsed = Number(value);
  if (parsed <= 0) {
    return Elevation.ZERO;
  }
  if (parsed === 1) {
    return Elevation.ONE;
  }
  if (parsed === 2) {
    return Elevation.TWO;
  }
  if (parsed === 3) {
    return Elevation.THREE;
  }
  return Elevation.FOUR;
};

const CardWidget: WidgetComponent = ({
  modifierKey,
  marker,
  blockNode,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS.card,
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const textWithoutMarker = blockNode.string.replace(marker.raw, "").trim();
  const [title = "", ...rest] = textWithoutMarker.split("\n");
  const bodyText = rest.join("\n").trim();
  const showTitle = !!settings.showTitle && !!title;
  const titleAlign = `${settings.titleAlign || "left"}` as "left" | "center" | "right";

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-card-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES.card}
          fields={WIDGET_SETTING_FIELDS.card}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <Card
        interactive={!!settings.interactive}
        elevation={toElevation(settings.elevation)}
        className={settings.compact ? "bpui-card-compact" : ""}
      >
        {showTitle && (
          <h5 className="bpui-card-title" style={{ textAlign: titleAlign }}>
            {title}
          </h5>
        )}
        {!!bodyText && <div className="bpui-card-body-text">{bodyText}</div>}
        {!!blockNode.children.length && (
          <div className="bpui-card-children">
            {blockNode.children
              .filter((child) => !child.string.startsWith("bpui::"))
              .map((child) => (
                <RoamBlockPreview key={child.uid} uid={child.uid} />
              ))}
          </div>
        )}
      </Card>
    </InlineWidgetShell>
  );
};

export default CardWidget;

