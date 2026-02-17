import React, { useEffect, useMemo, useState } from "react";
import { Alignment, Switch as BlueprintSwitch } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { WidgetComponent } from "~/widgets/types";

const SwitchWidget: WidgetComponent = ({
  modifierKey,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
  onPersistValue,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS.switch,
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const [checked, setChecked] = useState(!!instanceData.value);

  useEffect(() => {
    setChecked(!!instanceData.value);
  }, [instanceData.value]);

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-switch-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES.switch}
          fields={WIDGET_SETTING_FIELDS.switch}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <BlueprintSwitch
        checked={checked}
        disabled={!!settings.disabled}
        inline={!!settings.inline}
        alignIndicator={`${settings.alignIndicator}` === "right" ? Alignment.RIGHT : Alignment.LEFT}
        label={`${settings.label || ""}`}
        onChange={async (event) => {
          const next = (event.target as HTMLInputElement).checked;
          setChecked(next);
          await onPersistValue(
            next,
            `${settings.valueStorage || "props"}` === "child" ? "child" : "props",
            !!settings.hideValueChild,
          );
        }}
      />
    </InlineWidgetShell>
  );
};

export default SwitchWidget;

