import React, { useMemo } from "react";
import { Icon } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { WidgetComponent } from "~/widgets/types";

const IconWidget: WidgetComponent = ({
  modifierKey,
  marker,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS.icon,
      ...globalDefaults,
      ...(marker.parsed || {}),
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings, marker.parsed],
  );

  const icon = `${settings.icon || "star"}`;
  const size = Number(settings.size) || 14;
  const intent = `${settings.intent || "none"}`;

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-icon-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES.icon}
          fields={WIDGET_SETTING_FIELDS.icon}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <Icon
        icon={icon}
        iconSize={size}
        intent={intent === "none" ? undefined : (intent as "primary" | "success" | "warning" | "danger")}
      />
    </InlineWidgetShell>
  );
};

export default IconWidget;

