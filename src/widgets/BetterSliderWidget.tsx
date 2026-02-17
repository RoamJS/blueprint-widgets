import React, { useEffect, useMemo, useState } from "react";
import { Slider } from "@blueprintjs/core";
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

const BetterSliderWidget: WidgetComponent = ({
  modifierKey,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
  onPersistValue,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS["better-slider"],
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const defaultValue = toSafeNumber(settings.defaultValue, 0);
  const [value, setValue] = useState<number>(toSafeNumber(instanceData.value, defaultValue));

  useEffect(() => {
    setValue(toSafeNumber(instanceData.value, defaultValue));
  }, [instanceData.value, defaultValue]);

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-slider-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES["better-slider"]}
          fields={WIDGET_SETTING_FIELDS["better-slider"]}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <Slider
        min={toSafeNumber(settings.min, 0)}
        max={toSafeNumber(settings.max, 100)}
        stepSize={toSafeNumber(settings.stepSize, 1)}
        labelStepSize={toSafeNumber(settings.labelStepSize, 25)}
        vertical={!!settings.vertical}
        disabled={!!settings.disabled}
        value={value}
        onChange={(next) => setValue(next)}
        onRelease={async (next) =>
          onPersistValue(
            next,
            `${settings.valueStorage || "props"}` === "child" ? "child" : "props",
            !!settings.hideValueChild,
          )
        }
      />
    </InlineWidgetShell>
  );
};

export default BetterSliderWidget;

