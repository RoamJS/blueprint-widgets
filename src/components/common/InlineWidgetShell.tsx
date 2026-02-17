import React, { useEffect, useMemo, useState } from "react";
import { Button, Popover, Position } from "@blueprintjs/core";
import type { ModifierKey } from "~/types/widgets";

type InlineWidgetShellProps = {
  modifierKey: ModifierKey;
  className?: string;
  settingsContent?: React.ReactNode;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
};

const swallowBlockEditEvent = (event: React.SyntheticEvent): void => {
  event.stopPropagation();
};

const isModifierEventActive = (modifierKey: ModifierKey, event: KeyboardEvent): boolean => {
  if (modifierKey === "none") {
    return true;
  }
  if (modifierKey === "alt") {
    return event.altKey;
  }
  if (modifierKey === "ctrl") {
    return event.ctrlKey;
  }
  if (modifierKey === "shift") {
    return event.shiftKey;
  }
  if (modifierKey === "meta") {
    return event.metaKey;
  }
  return false;
};

const useModifierActive = (modifierKey: ModifierKey): boolean => {
  const [active, setActive] = useState(modifierKey === "none");

  useEffect(() => {
    if (modifierKey === "none") {
      setActive(true);
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      setActive(isModifierEventActive(modifierKey, event));
    };

    const onKeyUp = (): void => {
      setActive(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [modifierKey]);

  return active;
};

const InlineWidgetShell = ({
  modifierKey,
  className = "",
  settingsContent,
  extraActions,
  children,
}: InlineWidgetShellProps): JSX.Element => {
  const [isHovered, setIsHovered] = useState(false);
  const isModifierActive = useModifierActive(modifierKey);
  const canOpenSettings = modifierKey === "none" || isModifierActive;

  const shouldShowActions = useMemo(() => isHovered, [isHovered]);

  return (
    <span
      className={`bpui-inline-widget ${className}`.trim()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDownCapture={swallowBlockEditEvent}
      onPointerDownCapture={swallowBlockEditEvent}
      onClickCapture={swallowBlockEditEvent}
      onDoubleClickCapture={swallowBlockEditEvent}
    >
      <span className="bpui-widget-main">{children}</span>
      {shouldShowActions && (
        <span className="bpui-widget-actions">
          {extraActions}
          {settingsContent && canOpenSettings && (
            <Popover
              content={<div className="bpui-settings-popover">{settingsContent}</div>}
              position={Position.BOTTOM_RIGHT}
            >
              <Button
                small
                minimal
                icon="cog"
                title="Widget settings"
                className="bpui-settings-trigger"
              />
            </Popover>
          )}
        </span>
      )}
    </span>
  );
};

export default InlineWidgetShell;
