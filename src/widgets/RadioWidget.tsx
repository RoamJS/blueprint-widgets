import React, { useMemo } from "react";
import { Radio, RadioGroup } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { WidgetComponent } from "~/widgets/types";
import { updateBlockString } from "~/utils/roam";

const TODO_MARKER = "{{[[TODO]]}}";

type RadioOption = {
  uid: string;
  original: string;
  label: string;
  hasTodo: boolean;
};

const stripTodoMarker = (value: string): string =>
  value
    .replaceAll(TODO_MARKER, "")
    .replace(/\s+/g, " ")
    .trim();

const ensureTodoSuffix = (value: string): string => {
  const base = stripTodoMarker(value);
  return `${base} ${TODO_MARKER}`.trim();
};

const buildOptions = (children: { uid: string; string: string }[]): RadioOption[] =>
  children
    .filter((child) => !child.string.startsWith("bpui::"))
    .map((child) => ({
      uid: child.uid,
      original: child.string,
      label: stripTodoMarker(child.string),
      hasTodo: child.string.includes(TODO_MARKER),
    }))
    .filter((child) => !!child.label);

const RadioWidget: WidgetComponent = ({
  modifierKey,
  blockNode,
  instanceData,
  onSaveSettings,
  onResetSettings,
  onPatchInstance,
  globalDefaults,
}): JSX.Element => {
  const options = useMemo(() => buildOptions(blockNode.children), [blockNode.children]);
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS.radio,
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const selectedFromTodos = options.find((option) => option.hasTodo)?.label;
  const selectedValue = `${instanceData.selectedValue || selectedFromTodos || ""}`;

  const onSelect = async (nextLabel: string): Promise<void> => {
    await onPatchInstance({
      selectedValue: nextLabel,
    });

    if (!settings.writeSelectionAsTodos) {
      return;
    }

    await Promise.all(
      options.map(async (option) => {
        const nextString =
          option.label === nextLabel
            ? ensureTodoSuffix(option.original)
            : stripTodoMarker(option.original);
        await updateBlockString(option.uid, nextString);
      }),
    );
  };

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-radio-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES.radio}
          fields={WIDGET_SETTING_FIELDS.radio}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
    >
      <RadioGroup
        inline={!!settings.inline}
        selectedValue={selectedValue}
        onChange={(event) => onSelect((event.target as HTMLInputElement).value)}
      >
        {options.map((option) => (
          <Radio
            key={option.uid}
            value={option.label}
            label={option.label}
            disabled={!!settings.disabled}
            inline={!!settings.inline}
          />
        ))}
      </RadioGroup>
    </InlineWidgetShell>
  );
};

export default RadioWidget;
