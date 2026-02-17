# Blueprint Widgets

<a href="https://roamjs.com/">
    <img src="https://avatars.githubusercontent.com/u/138642184" alt="RoamJS Logo" title="RoamJS" align="right" height="60" />
</a>

**Turn inline `{{...}}` markers and hashtags into clean Blueprint v3 UI widgets with per-instance settings, hover controls, and persistent values.**

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RoamJS/blueprint-widgets)

## Features

- `{{radio}}` from child blocks with optional TODO suffix syncing
- `{{better-slider}}` with per-instance min/max/step plus props or child value storage
- `{{switch}}` widget with optional global TODO checkbox hijack
- `{{numeric-input}}` (plus `{{numeric input}}` alias) with seed-value parsing
- Hashtag styling into Blueprint Tag visuals with global and per-tag overrides
- `{{tabs}}` where child blocks define tab labels and descendants render tab panels
- `{{progress}}` minimal progress bar from `totalQuery::` and `progressQuery::` child blocks
- `{{icon:...}}` flexible icon syntax with GUI editor and props-backed settings
- `{{card}}` render layer with title/body parsing and Blueprint Card options
- Single observer engine with stable instance IDs (`widgetType:index` per block)

## Roadmap / TODO

- Query Builder layout integration for progress widgets
- Range slider variant for `better-slider`
- Stronger per-widget settings forms (advanced Blueprint props)
- Optional icon syntax normalization back into block text
- Tab title inline rename UX tied to source child block editing
