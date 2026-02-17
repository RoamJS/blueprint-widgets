import type { ModifierKey, SettingField, TagStyleConfig, WidgetType } from "~/types/widgets";

export const BPUI_NAMESPACE = "bpui";
export const BPUI_CONFIG_CHILD_PREFIX = "bpui::";
export const BPUI_DATA_VERSION = 1;

export const MODIFIER_KEYS: ModifierKey[] = ["none", "alt", "ctrl", "shift", "meta"];
export const INTENT_OPTIONS = ["none", "primary", "success", "warning", "danger"];

export const GLOBAL_SETTING_KEYS = {
  settingsModifierKey: "defaultModifierKeyForSettings",
  replaceTodosWithSwitch: "replaceRoamTodoWithSwitchUI",
  tagOverrides: "tagStyleOverridesJson",
  tagDefaults: "tagStyleDefaultsJson",
} as const;

export const WIDGET_DEFAULT_SETTING_KEYS: Record<WidgetType, string> = {
  radio: "defaultsRadioJson",
  "better-slider": "defaultsBetterSliderJson",
  switch: "defaultsSwitchJson",
  "numeric-input": "defaultsNumericInputJson",
  tabs: "defaultsTabsJson",
  progress: "defaultsProgressJson",
  icon: "defaultsIconJson",
  card: "defaultsCardJson",
};

export const WIDGET_DISPLAY_NAMES: Record<WidgetType, string> = {
  radio: "Radio",
  "better-slider": "Better Slider",
  switch: "Switch",
  "numeric-input": "Numeric Input",
  tabs: "Tabs",
  progress: "Progress",
  icon: "Icon",
  card: "Card",
};

export const WIDGET_DEFAULTS: Record<WidgetType, Record<string, unknown>> = {
  radio: {
    inline: false,
    disabled: false,
    writeSelectionAsTodos: true,
  },
  "better-slider": {
    min: 0,
    max: 100,
    stepSize: 1,
    vertical: false,
    labelStepSize: 25,
    defaultValue: 0,
    valueStorage: "props",
    hideValueChild: true,
    disabled: false,
  },
  switch: {
    inline: true,
    disabled: false,
    label: "",
    alignIndicator: "left",
    valueStorage: "props",
    hideValueChild: true,
  },
  "numeric-input": {
    min: 0,
    max: 100,
    stepSize: 1,
    majorStepSize: 10,
    minorStepSize: 0.1,
    defaultValue: 0,
    buttonPosition: "right",
    clampValueOnBlur: false,
    disabled: false,
    valueStorage: "props",
    hideValueChild: true,
  },
  tabs: {
    vertical: false,
    animate: false,
  },
  progress: {
    intent: "none",
    showCountsTooltip: true,
  },
  icon: {
    icon: "star",
    intent: "none",
    size: 14,
  },
  card: {
    interactive: false,
    elevation: 1,
    compact: false,
    showTitle: true,
    titleAlign: "left",
  },
};

export const TAG_DEFAULTS: TagStyleConfig = {
  intent: "none",
  minimal: true,
  round: false,
  iconLeft: "",
  iconRight: "",
};

export const WIDGET_SETTING_FIELDS: Record<WidgetType, SettingField[]> = {
  radio: [
    { key: "inline", label: "Inline", type: "boolean" },
    { key: "disabled", label: "Disabled", type: "boolean" },
    {
      key: "writeSelectionAsTodos",
      label: "Write Selection As TODO Suffix",
      type: "boolean",
    },
  ],
  "better-slider": [
    { key: "min", label: "Min", type: "number" },
    { key: "max", label: "Max", type: "number" },
    { key: "stepSize", label: "Step", type: "number" },
    { key: "vertical", label: "Vertical", type: "boolean" },
    { key: "labelStepSize", label: "Label Step Size", type: "number" },
    { key: "defaultValue", label: "Default Value", type: "number" },
    { key: "disabled", label: "Disabled", type: "boolean" },
    { key: "valueStorage", label: "Value Storage", type: "select", options: ["props", "child"] },
    { key: "hideValueChild", label: "Hide Value Child", type: "boolean" },
  ],
  switch: [
    { key: "inline", label: "Inline", type: "boolean" },
    { key: "disabled", label: "Disabled", type: "boolean" },
    { key: "label", label: "Label", type: "text" },
    {
      key: "alignIndicator",
      label: "Indicator Alignment",
      type: "select",
      options: ["left", "right"],
    },
    { key: "valueStorage", label: "Value Storage", type: "select", options: ["props", "child"] },
    { key: "hideValueChild", label: "Hide Value Child", type: "boolean" },
  ],
  "numeric-input": [
    { key: "min", label: "Min", type: "number" },
    { key: "max", label: "Max", type: "number" },
    { key: "stepSize", label: "Step", type: "number" },
    { key: "majorStepSize", label: "Major Step", type: "number" },
    { key: "minorStepSize", label: "Minor Step", type: "number" },
    { key: "defaultValue", label: "Default Value", type: "number" },
    { key: "disabled", label: "Disabled", type: "boolean" },
    {
      key: "buttonPosition",
      label: "Button Position",
      type: "select",
      options: ["left", "right", "none"],
    },
    { key: "clampValueOnBlur", label: "Clamp On Blur", type: "boolean" },
    { key: "valueStorage", label: "Value Storage", type: "select", options: ["props", "child"] },
    { key: "hideValueChild", label: "Hide Value Child", type: "boolean" },
  ],
  tabs: [
    { key: "vertical", label: "Vertical", type: "boolean" },
    { key: "animate", label: "Animate", type: "boolean" },
  ],
  progress: [
    {
      key: "intent",
      label: "Intent",
      type: "select",
      options: INTENT_OPTIONS,
    },
    {
      key: "showCountsTooltip",
      label: "Show Counts Tooltip",
      type: "boolean",
    },
  ],
  icon: [
    { key: "icon", label: "Icon", type: "text" },
    { key: "intent", label: "Intent", type: "select", options: INTENT_OPTIONS },
    { key: "size", label: "Size", type: "number" },
  ],
  card: [
    { key: "interactive", label: "Interactive", type: "boolean" },
    { key: "elevation", label: "Elevation (0-4)", type: "number" },
    { key: "compact", label: "Compact", type: "boolean" },
    { key: "showTitle", label: "Show Title", type: "boolean" },
    {
      key: "titleAlign",
      label: "Title Alignment",
      type: "select",
      options: ["left", "center", "right"],
    },
  ],
};

