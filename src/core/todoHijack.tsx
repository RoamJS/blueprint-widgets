import React from "react";
import ReactDOM from "react-dom";
import { Switch as BlueprintSwitch } from "@blueprintjs/core";

type MountedTodoSwitch = {
  host: HTMLSpanElement;
  onNativeChange: () => void;
  checkmark: HTMLElement | null;
};

const mountedTodoSwitches = new Map<HTMLInputElement, MountedTodoSwitch>();

const renderTodoSwitch = (input: HTMLInputElement, host: HTMLSpanElement): void => {
  ReactDOM.render(
    <span className="bpui-todo-switch">
      <BlueprintSwitch
        checked={input.checked}
        onChange={() => {
          input.click();
        }}
      />
    </span>,
    host,
  );
};

const mountTodoSwitch = (input: HTMLInputElement): void => {
  const host = document.createElement("span");
  host.className = "bpui-todo-switch-host";
  host.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  input.classList.add("bpui-native-checkbox-hidden");
  const checkmark = input
    .closest("label.check-container")
    ?.querySelector<HTMLElement>(".checkmark");
  checkmark?.classList.add("bpui-native-checkbox-hidden");
  input.insertAdjacentElement("afterend", host);

  const onNativeChange = (): void => {
    renderTodoSwitch(input, host);
  };

  input.addEventListener("change", onNativeChange);
  renderTodoSwitch(input, host);

  mountedTodoSwitches.set(input, { host, onNativeChange, checkmark: checkmark || null });
};

const unmountTodoSwitch = (input: HTMLInputElement): void => {
  const mounted = mountedTodoSwitches.get(input);
  if (!mounted) {
    return;
  }
  input.classList.remove("bpui-native-checkbox-hidden");
  mounted.checkmark?.classList.remove("bpui-native-checkbox-hidden");
  input.removeEventListener("change", mounted.onNativeChange);
  ReactDOM.unmountComponentAtNode(mounted.host);
  mounted.host.remove();
  mountedTodoSwitches.delete(input);
};

const findTodoInputs = (): HTMLInputElement[] =>
  Array.from(document.querySelectorAll<HTMLInputElement>(".roam-article input[type='checkbox']")).filter(
    (input) => !!input.closest("label.check-container"),
  );

export const reconcileTodoHijack = ({ enabled }: { enabled: boolean }): void => {
  if (!enabled) {
    Array.from(mountedTodoSwitches.keys()).forEach(unmountTodoSwitch);
    return;
  }

  const todoInputs = findTodoInputs();
  todoInputs.forEach((input) => {
    if (!document.body.contains(input)) {
      return;
    }
    if (mountedTodoSwitches.has(input)) {
      return;
    }
    if (input.offsetParent === null) {
      return;
    }
    mountTodoSwitch(input);
  });

  Array.from(mountedTodoSwitches.keys()).forEach((input) => {
    if (!document.body.contains(input) || !todoInputs.includes(input)) {
      unmountTodoSwitch(input);
    }
  });
};

export const cleanupTodoHijack = (): void => {
  Array.from(mountedTodoSwitches.keys()).forEach(unmountTodoSwitch);
};
