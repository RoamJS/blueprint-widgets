import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ProgressBar, Tooltip } from "@blueprintjs/core";
import {
  WIDGET_DISPLAY_NAMES,
  WIDGET_SETTING_FIELDS,
  WIDGET_DEFAULTS,
} from "~/constants/defaults";
import InlineWidgetShell from "~/components/common/InlineWidgetShell";
import WidgetSettingsPopover from "~/components/common/WidgetSettingsPopover";
import type { BlockNode } from "~/types/widgets";
import { runRoamQueryCount } from "~/utils/roam";
import type { WidgetComponent } from "~/widgets/types";

const parseNamedQueryChild = (children: BlockNode[], key: "totalQuery" | "progressQuery"): string => {
  const pattern = new RegExp(`^${key}\\s*::?\\s*(.*)$`, "i");
  const child = children.find((c) => pattern.test(c.string.trim()));
  if (!child) {
    return "";
  }
  return child.string.trim().replace(pattern, "$1").trim();
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseNumberLiteral = (source: string): number | null => {
  const trimmed = source.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const resolveCountSource = async (source: string): Promise<number> => {
  if (!source.trim()) {
    return 0;
  }
  const numberLiteral = parseNumberLiteral(source);
  if (numberLiteral !== null) {
    return numberLiteral;
  }
  return runRoamQueryCount(source);
};

const ProgressWidget: WidgetComponent = ({
  modifierKey,
  blockNode,
  instanceData,
  globalDefaults,
  onSaveSettings,
  onResetSettings,
}): JSX.Element => {
  const settings = useMemo(
    () => ({
      ...WIDGET_DEFAULTS.progress,
      ...globalDefaults,
      ...(instanceData.settings || {}),
    }),
    [globalDefaults, instanceData.settings],
  );

  const totalQuery = useMemo(() => parseNamedQueryChild(blockNode.children, "totalQuery"), [blockNode.children]);
  const progressQuery = useMemo(
    () => parseNamedQueryChild(blockNode.children, "progressQuery"),
    [blockNode.children],
  );
  const [counts, setCounts] = useState({
    total: 0,
    progress: 0,
  });
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!totalQuery || !progressQuery) {
      setCounts({ total: 0, progress: 0 });
      return;
    }
    setIsRefreshing(true);
    const [total, progress] = await Promise.all([
      resolveCountSource(totalQuery),
      resolveCountSource(progressQuery),
    ]);
    setCounts({
      total,
      progress,
    });
    setIsRefreshing(false);
  }, [progressQuery, totalQuery]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshIndex]);

  const value = counts.total === 0 ? 0 : clamp(counts.progress / counts.total, 0, 1);
  const progressBar = (
    <ProgressBar
      animate={!isRefreshing}
      stripes={!isRefreshing}
      value={value}
      intent={
        `${settings.intent || "none"}` === "none"
          ? undefined
          : (`${settings.intent || "none"}` as any)
      }
    />
  );

  return (
    <InlineWidgetShell
      modifierKey={modifierKey}
      className="bpui-progress-widget"
      settingsContent={
        <WidgetSettingsPopover
          widgetName={WIDGET_DISPLAY_NAMES.progress}
          fields={WIDGET_SETTING_FIELDS.progress}
          globalDefaults={globalDefaults}
          overrides={(instanceData.settings || {}) as Record<string, unknown>}
          onSave={onSaveSettings}
          onReset={onResetSettings}
        />
      }
      extraActions={
        <Button
          small
          minimal
          icon="refresh"
          loading={isRefreshing}
          title="Refresh progress"
          onClick={() => setRefreshIndex((current) => current + 1)}
        />
      }
    >
      {!!settings.showCountsTooltip ? (
        <Tooltip content={`${counts.progress}/${counts.total}`}>
          <span>{progressBar}</span>
        </Tooltip>
      ) : (
        progressBar
      )}
    </InlineWidgetShell>
  );
};

export default ProgressWidget;
