import {
  GLOBAL_SETTING_KEYS,
  MODIFIER_KEYS,
  TAG_DEFAULTS,
  WIDGET_DEFAULT_SETTING_KEYS,
  WIDGET_DEFAULTS,
  WIDGET_DISPLAY_NAMES,
} from "~/constants/defaults";
import type {
  ModifierKey,
  TagStyleConfig,
  TagStyleOverrides,
  WidgetType,
} from "~/types/widgets";

const parseJsonWithFallback = <T>(raw: unknown, fallback: T): T => {
  if (typeof raw !== "string" || !raw.trim()) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn("bpui failed to parse json setting", e);
    return fallback;
  }
};

const settingValue = (extensionAPI: any, key: string): unknown => extensionAPI.settings.get(key);

export const getModifierKeyForSettings = (extensionAPI: any): ModifierKey => {
  const raw = `${settingValue(extensionAPI, GLOBAL_SETTING_KEYS.settingsModifierKey) || "none"}`
    .trim()
    .toLowerCase();
  return MODIFIER_KEYS.includes(raw as ModifierKey) ? (raw as ModifierKey) : "none";
};

export const shouldReplaceTodosWithSwitch = (extensionAPI: any): boolean =>
  !!settingValue(extensionAPI, GLOBAL_SETTING_KEYS.replaceTodosWithSwitch);

export const getWidgetGlobalDefaults = (
  extensionAPI: any,
  widgetType: WidgetType,
): Record<string, unknown> => {
  const key = WIDGET_DEFAULT_SETTING_KEYS[widgetType];
  const fallback = WIDGET_DEFAULTS[widgetType];
  return parseJsonWithFallback<Record<string, unknown>>(settingValue(extensionAPI, key), fallback);
};

export const getTagDefaults = (extensionAPI: any): TagStyleConfig =>
  parseJsonWithFallback<TagStyleConfig>(
    settingValue(extensionAPI, GLOBAL_SETTING_KEYS.tagDefaults),
    TAG_DEFAULTS,
  );

export const getTagOverrides = (extensionAPI: any): TagStyleOverrides =>
  parseJsonWithFallback<TagStyleOverrides>(settingValue(extensionAPI, GLOBAL_SETTING_KEYS.tagOverrides), {});

export const registerSettingsPanel = ({
  extensionAPI,
  onSettingsChanged,
}: {
  extensionAPI: any;
  onSettingsChanged?: () => void;
}): void => {
  extensionAPI.settings.panel.create({
    tabTitle: "Blueprint Widgets",
    settings: [
      {
        id: GLOBAL_SETTING_KEYS.settingsModifierKey,
        name: "Settings Modifier Key",
        description: "none, alt, ctrl, shift, or meta",
        action: {
          type: "input",
          onChange: () => onSettingsChanged?.(),
        },
      },
      {
        id: GLOBAL_SETTING_KEYS.replaceTodosWithSwitch,
        name: "Replace Roam TODO With Switch UI",
        description: "When enabled, visible TODO checkboxes render as Blueprint Switches.",
        action: {
          type: "switch",
          onChange: () => onSettingsChanged?.(),
        },
      },
      {
        id: GLOBAL_SETTING_KEYS.tagDefaults,
        name: "Tag Style Defaults (JSON)",
        description:
          'Example: {"intent":"none","minimal":true,"round":false,"iconLeft":"","iconRight":""}',
        action: {
          type: "input",
          onChange: () => onSettingsChanged?.(),
        },
      },
      {
        id: GLOBAL_SETTING_KEYS.tagOverrides,
        name: "Tag Style Overrides (JSON)",
        description:
          'Example: {"Project":{"intent":"primary","round":true},"Blocked":{"intent":"danger"}}',
        action: {
          type: "input",
          onChange: () => onSettingsChanged?.(),
        },
      },
      ...Object.entries(WIDGET_DEFAULT_SETTING_KEYS).map(([widgetType, settingKey]) => ({
        id: settingKey,
        name: `${WIDGET_DISPLAY_NAMES[widgetType as WidgetType]} Defaults (JSON)`,
        description: `Override global defaults for ${WIDGET_DISPLAY_NAMES[widgetType as WidgetType]}.`,
        action: {
          type: "input",
          onChange: () => onSettingsChanged?.(),
        },
      })),
    ],
  });
};
