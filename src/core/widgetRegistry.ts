import BetterSliderWidget from "~/widgets/BetterSliderWidget";
import CardWidget from "~/widgets/CardWidget";
import IconWidget from "~/widgets/IconWidget";
import NumericInputWidget from "~/widgets/NumericInputWidget";
import ProgressWidget from "~/widgets/ProgressWidget";
import RadioWidget from "~/widgets/RadioWidget";
import SwitchWidget from "~/widgets/SwitchWidget";
import TabsWidget from "~/widgets/TabsWidget";
import type { WidgetRegistry } from "~/widgets/types";

const widgetRegistry: WidgetRegistry = {
  radio: RadioWidget,
  "better-slider": BetterSliderWidget,
  switch: SwitchWidget,
  "numeric-input": NumericInputWidget,
  tabs: TabsWidget,
  progress: ProgressWidget,
  icon: IconWidget,
  card: CardWidget,
};

export default widgetRegistry;

