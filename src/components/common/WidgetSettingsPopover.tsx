import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  FormGroup,
  HTMLSelect,
  InputGroup,
  NumericInput,
  Switch as BlueprintSwitch,
} from "@blueprintjs/core";
import type { SettingField } from "~/types/widgets";

type WidgetSettingsPopoverProps = {
  widgetName: string;
  fields: SettingField[];
  globalDefaults: Record<string, unknown>;
  overrides: Record<string, unknown>;
  onSave: (overrides: Record<string, unknown>) => Promise<void>;
  onReset: () => Promise<void>;
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? fallback : numberValue;
};

const WidgetSettingsPopover = ({
  widgetName,
  fields,
  globalDefaults,
  overrides,
  onSave,
  onReset,
}: WidgetSettingsPopoverProps): JSX.Element => {
  const [draft, setDraft] = useState<Record<string, unknown>>(overrides);
  const [isSaving, setIsSaving] = useState(false);
  const [rawJson, setRawJson] = useState(JSON.stringify(overrides, null, 2));

  useEffect(() => {
    setDraft(overrides);
    setRawJson(JSON.stringify(overrides, null, 2));
  }, [overrides]);

  const effectivePreview = useMemo(
    () => ({
      ...globalDefaults,
      ...draft,
    }),
    [globalDefaults, draft],
  );

  const setDraftField = (key: string, value: unknown): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveDraft = async (): Promise<void> => {
    setIsSaving(true);
    await onSave(draft);
    setIsSaving(false);
  };

  const saveRawJson = async (): Promise<void> => {
    try {
      const parsed = JSON.parse(rawJson) as Record<string, unknown>;
      setDraft(parsed);
      setIsSaving(true);
      await onSave(parsed);
    } catch (e) {
      console.warn("bpui failed to parse raw overrides json", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bpui-widget-settings-panel">
      <h4 className="bpui-widget-settings-title">{widgetName} Settings</h4>
      {fields.map((field) => (
        <FormGroup key={field.key} label={field.label} helperText={field.description}>
          {field.type === "boolean" && (
            <BlueprintSwitch
              checked={!!draft[field.key]}
              onChange={(event) => setDraftField(field.key, (event.target as HTMLInputElement).checked)}
            />
          )}
          {field.type === "number" && (
            <NumericInput
              value={toSafeNumber(draft[field.key], toSafeNumber(globalDefaults[field.key], 0))}
              onValueChange={(valueAsNumber) => setDraftField(field.key, valueAsNumber)}
              fill
            />
          )}
          {field.type === "text" && (
            <InputGroup
              value={`${draft[field.key] ?? ""}`}
              onChange={(event) => setDraftField(field.key, event.target.value)}
            />
          )}
          {field.type === "select" && (
            <HTMLSelect
              fill
              options={(field.options || []).map((option) => ({
                label: option,
                value: option,
              }))}
              value={`${draft[field.key] ?? ""}`}
              onChange={(event) => setDraftField(field.key, event.target.value)}
            />
          )}
        </FormGroup>
      ))}
      <div className="bpui-widget-settings-actions">
        <Button small intent="primary" text="Save" loading={isSaving} onClick={saveDraft} />
        <Button
          small
          text="Reset Overrides"
          onClick={async () => {
            await onReset();
            setDraft({});
            setRawJson("{}");
          }}
        />
      </div>
      <FormGroup
        label="Raw Overrides JSON"
        helperText="For advanced fields not included above."
        className="bpui-widget-settings-json"
      >
        <textarea
          className="bpui-widget-settings-json-textarea bp3-input"
          value={rawJson}
          onChange={(event) => setRawJson(event.target.value)}
          rows={6}
        />
      </FormGroup>
      <div className="bpui-widget-settings-actions">
        <Button small text="Save Raw JSON" onClick={saveRawJson} loading={isSaving} />
      </div>
      <div className="bpui-widget-settings-previews">
        <div>
          <h5>Global Defaults</h5>
          <pre>{JSON.stringify(globalDefaults, null, 2)}</pre>
        </div>
        <div>
          <h5>Effective Value</h5>
          <pre>{JSON.stringify(effectivePreview, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default WidgetSettingsPopover;

