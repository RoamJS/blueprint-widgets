import React, { useEffect, useMemo, useState } from "react";
import { NumericInput } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { WidgetComponent } from "~/widgets/types";

const toSafeNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const NumericInputWidget: WidgetComponent = ({
  modifierKey,
  marker,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
  onPersistValue,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS["numeric-input"],
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const markerSeed = marker.parsed.seedValue;
  const defaultValue =
    typeof markerSeed === "number"
      ? markerSeed
      : toSafeNumber(settings.defaultValue, toSafeNumber(markerSeed, 0));
  const [value, setValue] = useState(toSafeNumber(instanceData.value, defaultValue));

  useEffect(() => {
    setValue(toSafeNumber(instanceData.value, defaultValue));
  }, [instanceData.value, defaultValue]);

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-numeric-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES["numeric-input"]}
          fields={WIDGET_SETTING_FIELDS["numeric-input"]}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <NumericInput
        value={value}
        min={toSafeNumber(settings.min, 0)}
        max={toSafeNumber(settings.max, 100)}
        stepSize={toSafeNumber(settings.stepSize, 1)}
        majorStepSize={toSafeNumber(settings.majorStepSize, 10)}
        minorStepSize={toSafeNumber(settings.minorStepSize, 0.1)}
        disabled={!!settings.disabled}
        fill={false}
        buttonPosition={`${settings.buttonPosition}` as any}
        clampValueOnBlur={!!settings.clampValueOnBlur}
        onValueChange={async (next) => {
          const safe = Number.isNaN(next) ? defaultValue : next;
          setValue(safe);
          await onPersistValue(
            safe,
            `${settings.valueStorage || "props"}` === "child" ? "child" : "props",
            !!settings.hideValueChild,
          );
        }}
      />
    </InlineWidgetShell>
  );
};

export default NumericInputWidget;
