# Blueprint Widgets Plugin for Roam Blocks

## Summary
Build one RoamJS plugin (TypeScript + React) that renders inline Blueprint v3 widgets from `{{...}}` markers and hashtag DOM nodes, while preserving original block text.  
The plugin will use a single observer engine, a shared widget registry, per-instance settings in block props (`bpui` namespace), global defaults in extension settings, and hover-only settings controls by default.

## Scope
1. Implement widget modules: `radio`, `better-slider`, `switch`, `numeric-input`, `tabs`, `icon`, `card`, `progress`.
2. Implement hashtag styling module that transforms rendered hashtag DOM into Blueprint-like Tag UI behavior.
3. Implement TODO hijack option to replace rendered TODO checkboxes with Blueprint Switch UI.
4. Implement global defaults + per-instance overrides for all widgets.
5. Implement stable multi-instance identity: `blockUid + widgetType + instanceIndex`.
6. Provide README rewrite with user-facing features and roadmap/TODO.
7. Do not implement Query Builder layout integration for progress in MVP (replaced by `{{progress}}` per your instruction).

## Public Markers and Canonical Syntax
1. `{{radio}}`
2. `{{better-slider}}`
3. `{{switch}}`
4. `{{numeric-input}}` canonical, with alias support for `{{numeric input}}`
5. `{{tabs}}`
6. `{{icon:...}}` flexible parser
7. `{{card}}`
8. `{{progress}}`

## Plugin File/Module Structure
1. `src/index.ts`  
Bootstraps settings panel, observer engine, widget registry, unload cleanup.
2. `src/types/widgets.ts`  
Shared types for widget instances, settings, storage, marker tokens.
3. `src/constants/settings.ts`  
Setting keys, defaults, modifier key enum, widget type constants.
4. `src/utils/blockProps.ts`  
Read/write/remove `bpui` settings and values from block props.
5. `src/utils/instanceKeys.ts`  
`instanceKey` generation and marker-to-instance indexing.
6. `src/utils/markerParser.ts`  
Marker tokenization and icon parameter parsing.
7. `src/utils/domTargets.ts`  
Resolve block UID from DOM and create inline mount anchors.
8. `src/core/observerEngine.ts`  
Single debounced MutationObserver; scan, mount, reconcile, unmount.
9. `src/core/widgetRegistry.ts`  
Registry of widget adapters (`detect`, `render`, `dispose` hooks).
10. `src/core/settingsGate.ts`  
Hover/modifier logic for gear visibility and settings access.
11. `src/components/common/InlineWidgetShell.tsx`  
Shared inline wrapper, hover gear button, popover trigger.
12. `src/components/common/WidgetSettingsPopover.tsx`  
Per-instance settings editor with reset-to-default.
13. `src/widgets/*`  
One folder per widget: parser, renderer, settings schema, storage adapter.
14. `src/styles/bpui.css`  
Scoped CSS for inline widgets, hidden child-value blocks, hashtag tag styling.
15. `src/__tests__/*`  
Unit tests for parsing, settings merge, storage logic, and instance identity.

## Data Model and Storage Contract
1. Namespace root: `bpui`.
2. Per-instance settings: `bpui.<widgetType>.<instanceKey> = { ...overrides }`.
3. Per-instance value in props when applicable: `bpui.<widgetType>.<instanceKey>.value`.
4. Optional child storage metadata keys remain available for widgets that support it:
`valueStorage`, `valueChildUid`, `hideValueChild`.
5. Instance key format: `<widgetType>:<instanceIndex>`.
6. `instanceIndex` is computed from marker order for that widget type inside a block.
7. Global defaults live in extension settings panel under grouped widget sections.

## Observer and Rendering Strategy
1. Attach one MutationObserver to Roam main container.
2. Debounce reconciliation (e.g. 100ms) and process only added/changed block subtrees.
3. For each `.roam-block`, extract block UID and rendered text context.
4. Tokenize markers and produce instance descriptors.
5. Ensure one mount node per marker occurrence without deleting marker text.
6. Render widget inline adjacent to marker text with minimal footprint.
7. Keep a runtime map: `domNodeId -> mounted instance metadata`.
8. On block rerender/removal, unmount React root and clear runtime map.
9. Hashtag module separately scans hashtag anchors and wraps/styles them idempotently.
10. TODO hijack module scans rendered TODO checkbox controls and replaces checkbox UI only when enabled.

## Shared Settings UX
1. Default trigger: hover only.
2. Configurable modifier requirement: none/alt/ctrl/shift/meta.
3. Gear button appears only when trigger condition passes.
4. Gear opens Blueprint Popover with:
- Effective value preview (global default vs override)
- Editable per-instance fields
- Reset instance overrides
5. Keep widgets inline; hide advanced controls until hover settings UI is opened.

## Widget-Specific Implementation Decisions

### Radio (`{{radio}}`)
1. Source of options: direct children of marker block.
2. Render Blueprint `RadioGroup` + `Radio`.
3. Selection persistence: props `selectedValue`.
4. TODO behavior: `writeSelectionAsTodos` default true.
5. TODO write style: suffix TODO marker on selected option child; remove suffix TODO from siblings.
6. Keep child blocks editable and authoritative for option labels.

### Better Slider (`{{better-slider}}`)
1. Render Blueprint `Slider`.
2. Support multiple markers per block via instance indexing.
3. Default value storage: props.
4. Optional child storage mode:
- Child text is raw value string only (no `Value::` or `<widget>::` prefix).
- One value child per slider instance.
- Optional hide value child via scoped CSS class/selector.
5. Settings: min, max, step, vertical, label precision, disabled, defaultValue, storage mode.

### Switch (`{{switch}}`)
1. Render Blueprint `Switch`.
2. State persistence default: props.
3. Optional child storage support same raw-value child rule.
4. Global toggle: replace visible Roam TODO checkboxes with Blueprint Switch UI.
5. Hijack scope: only visible TODO checkboxes, not all raw marker text.
6. Toggling hijacked switch must trigger native Roam TODO check/uncheck semantics.

### Numeric Input (`{{numeric-input}}`)
1. Canonical marker: `{{numeric-input}}`.
2. Alias accepted: `{{numeric input}}`.
3. Optional seed parse: `{{numeric-input:42}}`.
4. Render Blueprint `NumericInput`.
5. Multi-instance support per block.
6. Storage: props default; optional child raw-value mode.
7. Settings: min, max, step, major/minor step, clamp, button position, disabled.

### Tags (existing hashtags)
1. No new marker.
2. Observe rendered hashtag nodes and apply Blueprint-like Tag rendering class/wrapper.
3. Global default tag style settings.
4. Per-tag-title override map in global settings:
`pageTitle -> { intent, minimal, round, iconLeft, iconRight }`.
5. Preserve hashtag navigation/click behavior by retaining underlying link element.

### Tabs (`{{tabs}}`)
1. Child blocks of marker block define tab titles.
2. Descendants of each title child are that tab’s panel content.
3. Render Blueprint `Tabs` + `Tab`.
4. Selected tab persistence in props per instance.
5. Initial selection default: first child tab.
6. MVP editing model: underlying Roam blocks remain editable; widget only controls show/hide.

### Progress (`{{progress}}`)
1. Implement as marker widget (not query-layout integration in MVP).
2. Data source: named child blocks under marker block:
- `totalQuery:: <query string>`
- `progressQuery:: <query string>`
3. Execute both queries via Roam API, count results, compute value:
`total===0 ? 0 : clamp(progress/total, 0, 1)`.
4. Render minimal Blueprint `ProgressBar`.
5. Hover controls: settings and refresh actions.
6. Optional settings: intent/color and counts tooltip.

### Icons (`{{icon:...}}`)
1. Parse flexible forms:
- `{{icon:<name>}}`
- `{{icon:name=search intent=primary size=16}}`
- `{{icon:search::16}}`
2. Missing fields fallback to defaults/global settings.
3. Multi-instance support per block.
4. GUI editor on hover settings for icon name, intent, size.
5. Persist GUI edits to props only; do not rewrite marker text.

### Card (`{{card}}`)
1. Render Blueprint `Card`.
2. Parse block text:
- First line as title when `showTitle=true`
- Remaining text and child blocks as body
3. Keep underlying block editable; card is render layer only.
4. Settings: interactive, elevation, compact, showTitle, title alignment.

## Settings Panel Design
1. Section: General
- `defaultModifierKeyForSettings`
- `showSettingsOnHover` behavior toggle if needed
2. Section per widget with default props.
3. Section: TODO hijack global toggle.
4. Section: Tag defaults and per-tag override map editor.
5. Section: Progress defaults (intent, tooltip, refresh behavior).

## Error Handling and Safety
1. Never delete or rewrite original marker text except explicit TODO suffix updates in Radio option children.
2. Guard against malformed markers; skip render rather than throw.
3. Fail-safe unmount if block UID cannot be resolved.
4. Query failures in progress widget show non-blocking inline warning state.
5. Strictly scoped CSS to avoid affecting non-widget Roam UI.

## Tests and Scenarios

### Unit Tests
1. Marker parser for all widget syntaxes, including icon shorthand and numeric alias.
2. Instance indexing for multiple occurrences in one block.
3. Settings merge precedence: global defaults < instance overrides.
4. Child value storage adapter with raw-value text mode.
5. Radio TODO suffix apply/remove behavior.
6. Progress query child parser (`totalQuery::`, `progressQuery::`).

### Integration/Behavior Tests (extension-level, mocked DOM/API)
1. Observer mounts/unmounts widgets on block render/rerender/removal.
2. Multiple widgets in same block and multiple instances of same widget type.
3. Settings gear visibility under hover/modifier combinations.
4. TODO hijack toggle on/off behavior and semantic check state persistence.
5. Tabs selecting and persisting active tab.
6. Hashtag styling preserves click navigation.

### Manual Acceptance Checklist
1. Original marker text remains visible/editable for all widgets.
2. No duplicate mounts after rapid block edits.
3. Widget state persists across Roam rerenders/reloads.
4. Inline UI remains minimal; settings only on hover trigger.
5. Unload removes observers, listeners, and mounted roots cleanly.

## README Deliverables
1. Rename README title/description to final plugin branding.
2. Add user-facing Features section listing all widgets.
3. Add roadmap/TODO section with explicit future items:
- Query Builder progress layout integration
- RangeSlider support
- Tag insertion helper
- Advanced icon syntax normalization options
- Richer tab-title editing UX

## Assumptions and Defaults Chosen
1. Blueprint version locked to v3-compatible components/APIs.
2. `{{numeric-input}}` is canonical; `{{numeric input}}` accepted as alias.
3. Progress shipped as `{{progress}}` widget instead of query-renderer layout for MVP.
4. Progress queries are stored in named child blocks (`totalQuery::`, `progressQuery::`).
5. Value child storage uses raw child text value directly.
6. Settings gear trigger default is hover-only.
7. Icon GUI edits persist to props, not marker text rewrites.
8. TODO hijack defaults to off and applies only to visible TODO checkboxes.
9. Radio TODO updates use suffix-style marker changes on option child text.
