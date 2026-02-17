import runExtension from "roamjs-components/util/runExtension";
import { render as renderToast } from "roamjs-components/components/Toast";
import "~/styles/bpui.css";
import createObserverEngine from "~/core/observerEngine";
import { registerSettingsPanel } from "~/core/settings";

export default runExtension(async ({ extensionAPI }) => {
  if (process.env.NODE_ENV === "development") {
    renderToast({
      id: "extension-base-loaded",
      content: "Successfully loaded Blueprint Widgets",
      intent: "success",
      timeout: 500,
    });
  }

  const observerEngine = createObserverEngine({ extensionAPI });
  registerSettingsPanel({
    extensionAPI,
    onSettingsChanged: () => observerEngine.refresh(),
  });
  observerEngine.start();

  return {
    unload: () => {
      observerEngine.stop();
    },
  };
});
