// ==UserScript==
// @name         Ekphrasis
// @namespace    ekphrasis
// @version      4.0.0
// @description  Prompt studio for NovelAI — templates, weights, randomizers, and batch queue
// @author       lemburlab
// @match        https://novelai.net/image*
// @icon         https://novelai.net/icons/novelai-round.png
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    VERSION: "4.0.0",
    STORAGE_KEY_LIBRARY: "ekphrasis.library.v4",
    STORAGE_KEY_SETTINGS_DOC: "ekphrasis.settings.v4",
    STORAGE_KEY_SESSION: "ekphrasis.session.v4",
    STORAGE_KEY_MIGRATED_V4: "ekphrasis.migrated.v4",
    STORAGE_KEY_TEMPLATES: "nai_ext_templates_v3",
    STORAGE_KEY_PLACEHOLDERS: "nai_ext_placeholders",
    STORAGE_KEY_CATEGORIES: "nai_ext_categories",
    STORAGE_KEY_NEGATIVE_TEMPLATES: "nai_ext_negative_templates_v3",
    STORAGE_KEY_SETTINGS: "nai_ext_settings_v3",
    STORAGE_KEY_QUEUE_STATE: "nai_ext_queue_state",
    STORAGE_KEY_LEGACY_TEMPLATES: "nai_ext_templates_v2",
    STORAGE_KEY_LEGACY_ARTISTS: "nai_ext_artists",
    DEFAULT_DELAY: 2000,
    GENERATION_CHECK_INTERVAL: 1000,
    DEFAULT_PLACEHOLDERS: ["artist", "character", "style"],
    WEIGHT_MULTIPLIER: 1.05,
    PLACEHOLDER_REGEX: /\{(\w+)\}/g,
    BATCH_ADD_YIELD_INTERVAL: 250,
    PLACEHOLDER_RENDER_PAGE_SIZE: 200,
    FREE_SAFE_MAX_STEPS: 28,
    RANDOMIZER_DEFAULT_ENABLED: false,
  };

  const DEFAULT_CATEGORY_PRESETS = [
    { label: "general", color: "#7C8796" },
    { label: "portraits", color: "#FF7A90" },
    { label: "landscapes", color: "#5FA8D3" },
  ];

  const MODEL_STORAGE_KEY_MAP = {
    v45_full: "v4-5-full",
    v45_curated: "v4-5-curated",
    v4_full: "v4-full",
    v4_curated: "v4-curated",
    v3: "v3",
  };

  const MODEL_UI_KEY_MAP = Object.fromEntries(
    Object.entries(MODEL_STORAGE_KEY_MAP).map(([uiKey, storageKey]) => [
      storageKey,
      uiKey,
    ]),
  );

  // ============================================
  // ============================================
  // ART STYLE PRESETS
  // ============================================
  const STYLE_PRESETS = {
    movements: {
      abstract: "abstract",
      art_nouveau: "art nouveau",
      impressionism: "impressionism",
      ukiyo_e: "ukiyo-e",
      realistic: "realistic",
    },
    traditional: {
      watercolor: "watercolor",
      oil_painting: "oil painting",
      ink: "ink drawing",
      graphite: "graphite sketch",
      pastel: "pastel",
    },
    digital: {
      painterly: "painterly",
      sketch: "sketch",
      lineart: "lineart",
      vector_trace: "vector style",
    },
  };

  // ============================================
  // QUALITY TAG PRESETS (model-aware)
  // ============================================
  const QUALITY_TAG_PRESETS = {
    v45_full:    { label: "V4.5 Full",  tags: "location, very aesthetic, masterpiece, no text" },
    v45_curated: { label: "V4.5 Cur",   tags: "location, masterpiece, no text, -0.8::feet::, rating:general" },
    v4_full:     { label: "V4 Full",    tags: "no text, best quality, very aesthetic, absurdres" },
    v4_curated:  { label: "V4 Cur",     tags: "rating:general, amazing quality, very aesthetic, absurdres" },
    v3:          { label: "V3",         tags: "best quality, amazing quality, very aesthetic, absurdres" },
  };

  // ============================================
  // STYLES - Ekphrasis Brand Dark Theme v1.0
  // ============================================
  const STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        /* ============ DESIGN TOKENS ============ */
        #nai-ext-panel {
            --ekp-font-mono: "IBM Plex Mono", "JetBrains Mono", "Menlo", "Consolas", monospace;
            --ekp-font-sans: "IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif;

            --ekp-bg-base:      #0E0E10;
            --ekp-bg-surface:   #16161A;
            --ekp-bg-elevated:  #1E1E24;
            --ekp-bg-input:     #0A0A0C;
            --ekp-bg-hover:     #22222A;
            --ekp-bg-active:    #2A2A33;

            --ekp-border:        #2A2A30;
            --ekp-border-strong: #3A3A42;

            --ekp-fg-primary:    #EDEDF0;
            --ekp-fg-muted:      #9A9AA3;
            --ekp-fg-subtle:     #6A6A73;
            --ekp-fg-inverse:    #0E0E10;

            --ekp-accent:        #5FBFA8;
            --ekp-accent-hover:  #6FCFB8;
            --ekp-accent-active: #4FAF98;
            --ekp-accent-fg:     #0A1F1A;

            --ekp-success:       #6EC78B;
            --ekp-warning:       #E0B85C;
            --ekp-error:         #E07B7B;
            --ekp-info:          #7BB5E0;

            --ekp-focus-ring: 0 0 0 2px rgba(95, 191, 168, 0.4);

            --ekp-radius-sm: 3px;
            --ekp-radius-md: 5px;
            --ekp-radius-lg: 8px;
            --ekp-radius-pill: 9999px;

            --ekp-duration-fast: 100ms;
            --ekp-duration-base: 150ms;
            --ekp-duration-slow: 250ms;
            --ekp-easing: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ============ MAIN PANEL ============ */
        #nai-ext-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 360px;
            max-height: calc(100vh - 90px);
            background: var(--ekp-bg-surface);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-md);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            font-family: var(--ekp-font-mono);
            font-size: 13px;
            color: var(--ekp-fg-primary);
            z-index: 10000;
            overflow: hidden;
            transition: all var(--ekp-duration-slow) var(--ekp-easing);
        }

        #nai-ext-panel.minimized {
            width: 180px;
            max-height: 42px;
        }

        #nai-ext-panel.minimized .nai-ext-body {
            display: none;
        }

        #nai-ext-maximize {
            display: none;
        }

        #nai-ext-panel.minimized #nai-ext-minimize {
            display: none;
        }

        #nai-ext-panel.minimized #nai-ext-maximize {
            display: inline-block;
        }

        #nai-ext-panel.minimized .nai-ext-title span:not(.nai-ext-title-icon) {
            display: none;
        }

        #nai-ext-panel.minimized .nai-ext-header {
            cursor: pointer;
            padding: 8px 10px;
        }

        /* ============ HEADER ============ */
        .nai-ext-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: var(--ekp-bg-base);
            border-bottom: 1px solid var(--ekp-border);
            cursor: move;
            user-select: none;
        }

        .nai-ext-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            font-size: 13px;
            color: var(--ekp-fg-primary);
            letter-spacing: 0;
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-title-icon {
            color: var(--ekp-accent);
            font-size: 14px;
        }

        .nai-ext-controls {
            display: flex;
            gap: 4px;
        }

        .nai-ext-btn-icon {
            background: transparent;
            border: none;
            color: var(--ekp-fg-subtle);
            cursor: pointer;
            padding: 4px 6px;
            border-radius: var(--ekp-radius-sm);
            transition: background var(--ekp-duration-fast) var(--ekp-easing),
                        color var(--ekp-duration-fast) var(--ekp-easing);
            font-size: 14px;
            line-height: 1;
        }

        .nai-ext-btn-icon:hover {
            background: var(--ekp-bg-hover);
            color: var(--ekp-fg-primary);
        }

        /* ============ BODY ============ */
        .nai-ext-body {
            padding: 8px 12px;
            overflow-y: auto;
            max-height: calc(100vh - 130px);
            background: var(--ekp-bg-surface);
        }

        /* ============ SECTIONS ============ */
        .nai-ext-section {
            margin-bottom: 12px;
            background: transparent;
            border-radius: 0;
            padding: 0;
            border: none;
        }

        .nai-ext-section:last-child {
            margin-bottom: 0;
        }

        .nai-ext-section-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
            padding-bottom: 5px;
            font-weight: 500;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--ekp-fg-muted);
            border-bottom: 1px solid var(--ekp-border);
        }

        .nai-ext-section-icon {
            font-size: 11px;
            opacity: 0.7;
        }

        /* ============ TEMPLATE LIST ============ */
        .nai-ext-template-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            max-height: 180px;
            overflow-y: auto;
            margin-bottom: 8px;
        }

        .nai-ext-template-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            background: var(--ekp-bg-surface);
            border-radius: var(--ekp-radius-sm);
            cursor: pointer;
            transition: background var(--ekp-duration-fast) var(--ekp-easing),
                        border-color var(--ekp-duration-fast) var(--ekp-easing);
            border: 1px solid var(--ekp-border);
        }

        .nai-ext-template-item:hover {
            background: var(--ekp-bg-hover);
            border-color: var(--ekp-border-strong);
        }

        .nai-ext-template-item.active {
            background: var(--ekp-bg-hover);
            border-color: var(--ekp-accent);
            color: var(--ekp-fg-primary);
        }

        .nai-ext-template-item.active .nai-ext-template-btn {
            color: var(--ekp-fg-muted);
        }

        .nai-ext-template-item.active .nai-ext-template-btn:hover {
            color: var(--ekp-fg-primary);
        }

        .nai-ext-template-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            font-weight: 400;
            color: var(--ekp-fg-primary);
        }

        .nai-ext-template-actions {
            display: flex;
            gap: 2px;
            opacity: 0;
            transition: opacity var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-template-item:hover .nai-ext-template-actions {
            opacity: 1;
        }

        .nai-ext-template-btn {
            background: transparent;
            border: none;
            color: var(--ekp-fg-subtle);
            cursor: pointer;
            padding: 2px 5px;
            font-size: 11px;
            transition: color var(--ekp-duration-fast) var(--ekp-easing);
            border-radius: var(--ekp-radius-sm);
        }

        .nai-ext-template-btn:hover {
            color: var(--ekp-fg-primary);
            background: var(--ekp-bg-active);
        }

        .nai-ext-template-btn.delete:hover {
            color: var(--ekp-error);
        }

        /* ============ TAGS / CHIPS ============ */
        .nai-ext-artist-container {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 8px;
        }

        .nai-ext-artist-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-pill);
            font-size: 11px;
            font-weight: 400;
            cursor: pointer;
            transition: background var(--ekp-duration-fast) var(--ekp-easing),
                        border-color var(--ekp-duration-fast) var(--ekp-easing),
                        color var(--ekp-duration-fast) var(--ekp-easing);
            user-select: none;
            color: var(--ekp-fg-muted);
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-artist-tag:hover {
            background: var(--ekp-bg-hover);
            border-color: var(--ekp-border-strong);
            color: var(--ekp-fg-primary);
        }

        .nai-ext-artist-tag.selected {
            background: var(--ekp-bg-active);
            border-color: var(--ekp-accent);
            color: var(--ekp-accent);
        }

        .nai-ext-artist-remove {
            margin-left: 2px;
            opacity: 0.5;
            font-size: 10px;
        }

        .nai-ext-artist-remove:hover {
            opacity: 1;
            color: var(--ekp-error);
        }

        .nai-ext-artist-tag.selected .nai-ext-artist-remove:hover {
            color: var(--ekp-error);
        }

        /* ============ INPUTS ============ */
        .nai-ext-input-group {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
        }

        .nai-ext-input {
            flex: 1;
            padding: 6px 10px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-primary);
            font-size: 12px;
            font-weight: 400;
            font-family: var(--ekp-font-mono);
            transition: border-color var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-input:focus {
            outline: none;
            border-color: var(--ekp-accent);
            box-shadow: var(--ekp-focus-ring);
        }

        .nai-ext-input::placeholder {
            color: var(--ekp-fg-subtle);
        }

        .nai-ext-textarea {
            width: 100%;
            min-height: 50px;
            padding: 8px 10px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-primary);
            font-size: 12px;
            resize: vertical;
            font-family: var(--ekp-font-mono);
            line-height: 1.5;
        }

        .nai-ext-textarea:focus {
            outline: none;
            border-color: var(--ekp-accent);
            box-shadow: var(--ekp-focus-ring);
        }

        /* ============ BUTTONS ============ */
        .nai-ext-btn {
            padding: 6px 14px;
            background: var(--ekp-accent);
            border: none;
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-accent-fg);
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0;
            text-transform: none;
            cursor: pointer;
            font-family: var(--ekp-font-mono);
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-btn:hover {
            background: var(--ekp-accent-hover);
        }

        .nai-ext-btn:active {
            background: var(--ekp-accent-active);
        }

        .nai-ext-btn.secondary {
            background: var(--ekp-bg-elevated);
            color: var(--ekp-fg-primary);
            border: 1px solid var(--ekp-border);
        }

        .nai-ext-btn.secondary:hover {
            background: var(--ekp-bg-hover);
            border-color: var(--ekp-border-strong);
        }

        .nai-ext-btn.danger {
            background: transparent;
            color: var(--ekp-error);
            border: 1px solid var(--ekp-error);
        }

        .nai-ext-btn.danger:hover {
            background: rgba(224, 123, 123, 0.12);
        }

        .nai-ext-btn.success {
            background: var(--ekp-accent);
        }

        .nai-ext-btn.success:hover {
            background: var(--ekp-accent-hover);
        }

        .nai-ext-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
        }

        .nai-ext-btn-row {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }

        .nai-ext-btn-full {
            width: 100%;
        }

        /* ============ QUEUE RESUME BANNER ============ */
        .nai-ext-queue-resume-banner {
            background: rgba(224, 184, 92, 0.08);
            border: 1px solid rgba(224, 184, 92, 0.3);
            border-radius: var(--ekp-radius-sm);
            padding: 8px 10px;
            margin-bottom: 6px;
            font-size: 11px;
        }
        .nai-ext-resume-info {
            color: var(--ekp-warning);
            margin-bottom: 6px;
            line-height: 1.4;
        }
        .nai-ext-resume-actions {
            display: flex;
            gap: 4px;
        }

        /* ============ QUEUE ============ */
        .nai-ext-queue-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            max-height: 150px;
            overflow-y: auto;
            margin-bottom: 8px;
        }

        .nai-ext-queue-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 10px;
            background: var(--ekp-bg-surface);
            border-radius: var(--ekp-radius-sm);
            font-size: 11px;
            border: 1px solid var(--ekp-border);
            color: var(--ekp-fg-muted);
        }

        .nai-ext-queue-item.current {
            background: var(--ekp-bg-hover);
            color: var(--ekp-fg-primary);
            border-color: var(--ekp-accent);
        }

        .nai-ext-queue-item.completed {
            opacity: 0.35;
            text-decoration: line-through;
        }

        .nai-ext-queue-item.failed {
            background: rgba(224, 123, 123, 0.08);
            border-color: rgba(224, 123, 123, 0.4);
            color: var(--ekp-error);
        }

        .nai-ext-queue-item.failed .nai-ext-queue-status {
            color: var(--ekp-error);
        }

        .nai-ext-queue-status {
            font-size: 11px;
        }

        .nai-ext-queue-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .nai-ext-queue-remove {
            background: transparent;
            border: none;
            color: var(--ekp-fg-subtle);
            cursor: pointer;
            font-size: 11px;
            padding: 2px 4px;
            border-radius: var(--ekp-radius-sm);
            transition: color var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-queue-remove:hover {
            color: var(--ekp-error);
        }

        .nai-ext-queue-item.current .nai-ext-queue-remove:hover {
            color: var(--ekp-error);
        }

        .nai-ext-queue-retry {
            background: transparent;
            border: none;
            color: var(--ekp-warning);
            cursor: pointer;
            font-size: 11px;
            padding: 2px 4px;
            border-radius: var(--ekp-radius-sm);
        }

        .nai-ext-queue-retry:hover {
            color: var(--ekp-fg-primary);
        }

        /* ============ PROGRESS BAR ============ */
        .nai-ext-progress {
            margin-bottom: 12px;
        }

        .nai-ext-progress-text {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 10px;
            font-weight: 500;
            color: var(--ekp-fg-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .nai-ext-progress-bar {
            height: 3px;
            background: var(--ekp-border);
            border-radius: var(--ekp-radius-pill);
            overflow: hidden;
        }

        .nai-ext-progress-fill {
            height: 100%;
            background: var(--ekp-accent);
            border-radius: var(--ekp-radius-pill);
            transition: width 0.3s var(--ekp-easing);
        }

        /* ============ STATUS ============ */
        .nai-ext-status {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: var(--ekp-bg-elevated);
            border-radius: var(--ekp-radius-sm);
            font-size: 10px;
            font-weight: 500;
            margin-bottom: 8px;
            border: 1px solid var(--ekp-border);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--ekp-fg-muted);
        }

        .nai-ext-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--ekp-fg-subtle);
            flex-shrink: 0;
        }

        .nai-ext-status-dot.running {
            background: var(--ekp-success);
            animation: pulse 1.5s infinite;
        }

        .nai-ext-status-dot.paused {
            background: var(--ekp-warning);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* ============ EMPTY STATE ============ */
        .nai-ext-empty {
            text-align: center;
            padding: 12px;
            color: var(--ekp-fg-subtle);
            font-size: 11px;
        }

        /* ============ TOOLTIP ============ */
        .nai-ext-tooltip {
            position: relative;
        }

        .nai-ext-tooltip::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: calc(100% + 4px);
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 8px;
            background: var(--ekp-bg-elevated);
            color: var(--ekp-fg-primary);
            border: 1px solid var(--ekp-border-strong);
            font-size: 10px;
            border-radius: var(--ekp-radius-sm);
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--ekp-duration-base) var(--ekp-easing);
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-tooltip:hover::after {
            opacity: 1;
        }

        /* ============ SETTINGS ============ */
        .nai-ext-settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid var(--ekp-border);
        }

        .nai-ext-settings-row:last-child {
            border-bottom: none;
        }

        .nai-ext-settings-label {
            font-size: 12px;
            font-weight: 400;
            color: var(--ekp-fg-primary);
        }

        .nai-ext-number-input {
            width: 80px;
            padding: 5px 8px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-primary);
            font-size: 12px;
            font-family: var(--ekp-font-mono);
            text-align: center;
        }

        .nai-ext-number-input:focus {
            outline: none;
            border-color: var(--ekp-accent);
            box-shadow: var(--ekp-focus-ring);
        }

        /* ============ SCROLLBAR ============ */
        .nai-ext-body::-webkit-scrollbar,
        .nai-ext-template-list::-webkit-scrollbar,
        .nai-ext-queue-list::-webkit-scrollbar {
            width: 4px;
        }

        .nai-ext-body::-webkit-scrollbar-track,
        .nai-ext-template-list::-webkit-scrollbar-track,
        .nai-ext-queue-list::-webkit-scrollbar-track {
            background: transparent;
        }

        .nai-ext-body::-webkit-scrollbar-thumb,
        .nai-ext-template-list::-webkit-scrollbar-thumb,
        .nai-ext-queue-list::-webkit-scrollbar-thumb {
            background: var(--ekp-border-strong);
            border-radius: var(--ekp-radius-pill);
        }

        .nai-ext-body::-webkit-scrollbar-thumb:hover,
        .nai-ext-template-list::-webkit-scrollbar-thumb:hover,
        .nai-ext-queue-list::-webkit-scrollbar-thumb:hover {
            background: var(--ekp-fg-subtle);
        }

        /* ============ COLLAPSIBLE ============ */
        .nai-ext-section-header.collapsible {
            cursor: pointer;
        }

        .nai-ext-section-header.collapsible::after {
            content: '−';
            margin-left: auto;
            font-size: 12px;
            color: var(--ekp-fg-subtle);
            transition: color var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-section.collapsed .nai-ext-section-header.collapsible::after {
            content: '+';
        }

        .nai-ext-section.collapsed .nai-ext-section-content {
            display: none;
        }

        /* ============ PREVIEW ============ */
        #nai-ext-preview,
        #nai-ext-preview-negative {
            padding: 8px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            font-size: 11px;
            color: var(--ekp-fg-muted);
            font-family: var(--ekp-font-mono);
            word-break: break-all;
            max-height: 70px;
            overflow-y: auto;
            line-height: 1.5;
        }

        #nai-ext-preview-negative {
            border-top: none;
            margin-top: 4px;
            color: var(--ekp-fg-subtle);
            background: var(--ekp-bg-base);
        }

        /* ============ TABS ============ */
        .nai-ext-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            margin-bottom: 7px;
        }

        .nai-ext-tab {
            padding: 4px 8px;
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--ekp-radius-sm);
            font-size: 10px;
            font-weight: 400;
            font-family: var(--ekp-font-mono);
            color: var(--ekp-fg-muted);
            cursor: pointer;
            transition: color var(--ekp-duration-fast) var(--ekp-easing),
                        background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-tab:hover {
            color: var(--ekp-fg-primary);
            background: var(--ekp-bg-hover);
        }

        .nai-ext-tab.active {
            color: var(--ekp-fg-primary);
            background: var(--ekp-bg-elevated);
            border-color: var(--ekp-border);
        }

        .nai-ext-tab-add {
            padding: 4px 8px;
        }

        .nai-ext-tab-action {
            display: inline-block;
            margin-left: 3px;
            font-size: 9px;
            opacity: 0.5;
            cursor: pointer;
            padding: 0 2px;
            border-radius: 2px;
            vertical-align: middle;
        }

        .nai-ext-tab-action:hover {
            opacity: 1;
        }

        /* ============ PLACEHOLDER VALUES ============ */
        .nai-ext-placeholder-values {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 7px;
            max-height: 90px;
            overflow-y: auto;
        }

        /* ============ CATEGORY BADGE ============ */
        .nai-ext-template-category {
            font-size: 9px;
            padding: 1px 5px;
            background: var(--ekp-bg-elevated);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-pill);
            color: var(--ekp-fg-subtle);
            margin-left: 6px;
            text-transform: lowercase;
        }

        /* ============ CHECKBOX ============ */
        .nai-ext-checkbox-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: var(--ekp-fg-muted);
            cursor: pointer;
            margin-bottom: 4px;
        }

        .nai-ext-checkbox-row input[type="checkbox"] {
            width: 13px;
            height: 13px;
            accent-color: var(--ekp-accent);
        }

        /* ============ QUALITY PRESET ============ */
        .nai-ext-preset-select {
            width: 100%;
            padding: 6px 10px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-primary);
            font-size: 11px;
            font-family: var(--ekp-font-mono);
            margin-bottom: 8px;
            cursor: pointer;
        }

        .nai-ext-preset-select:focus {
            outline: none;
            border-color: var(--ekp-accent);
            box-shadow: var(--ekp-focus-ring);
        }

        /* ============ WEIGHT EDITOR ============ */
        .nai-ext-weight-editor {
            background: var(--ekp-bg-elevated);
            padding: 8px;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            margin-bottom: 8px;
        }

        .nai-ext-weight-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 5px;
        }

        .nai-ext-weight-row:last-child {
            margin-bottom: 0;
        }

        .nai-ext-weight-tag {
            flex: 1;
            font-size: 11px;
            font-family: var(--ekp-font-mono);
            color: var(--ekp-fg-primary);
        }

        .nai-ext-weight-slider {
            width: 80px;
            accent-color: var(--ekp-accent);
        }

        .nai-ext-weight-value {
            width: 50px;
            text-align: center;
            font-size: 11px;
            font-family: var(--ekp-font-mono);
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            padding: 3px;
            color: var(--ekp-fg-primary);
        }

        /* ============ RANDOMIZER PREVIEW ============ */
        .nai-ext-randomizer-preview {
            background: rgba(95, 191, 168, 0.06);
            border: 1px solid rgba(95, 191, 168, 0.2);
            border-radius: var(--ekp-radius-sm);
            padding: 7px;
            margin-bottom: 7px;
            font-size: 11px;
        }

        .nai-ext-randomizer-variation {
            padding: 4px 8px;
            margin: 3px 0;
            background: var(--ekp-bg-elevated);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            cursor: pointer;
            color: var(--ekp-fg-muted);
            font-family: var(--ekp-font-mono);
            font-size: 10px;
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-randomizer-variation:hover {
            background: var(--ekp-bg-hover);
            color: var(--ekp-fg-primary);
        }

        /* ============ MULTI-CHARACTER ============ */
        .nai-ext-char-slot {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px;
            background: var(--ekp-bg-elevated);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            margin-bottom: 4px;
            font-size: 11px;
            cursor: pointer;
            color: var(--ekp-fg-muted);
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-char-slot:hover {
            background: var(--ekp-bg-hover);
            color: var(--ekp-fg-primary);
        }

        .nai-ext-char-label {
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            width: 60px;
            color: var(--ekp-fg-subtle);
        }

        /* ============ NEGATIVE TEMPLATE ITEMS ============ */
        .nai-ext-neg-template-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 5px 8px;
            background: var(--ekp-bg-surface);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            margin-bottom: 3px;
            font-size: 11px;
            cursor: pointer;
            color: var(--ekp-fg-muted);
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-neg-template-item:hover {
            background: var(--ekp-bg-hover);
            border-color: var(--ekp-border-strong);
        }

        .nai-ext-neg-template-item.active {
            background: var(--ekp-bg-hover);
            border-color: var(--ekp-accent);
            color: var(--ekp-fg-primary);
        }

        .nai-ext-neg-template-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* ============ TAG GROUP HEADERS ============ */
        .nai-ext-tag-group-header {
            font-size: 9px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ekp-fg-subtle);
            margin: 6px 0 4px 0;
            padding-bottom: 3px;
            border-bottom: 1px solid var(--ekp-border);
        }

        /* ============ RESPONSIVE ============ */
        @media (max-height: 800px) {
            #nai-ext-panel {
                top: 60px;
                max-height: calc(100vh - 80px);
            }
            .nai-ext-body {
                padding: 6px 9px;
                max-height: calc(100vh - 105px);
            }
            .nai-ext-section {
                margin-bottom: 9px;
            }
            .nai-ext-template-list {
                max-height: 140px;
            }
        }

        /* ============ FOOTER ============ */
        .nai-ext-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--ekp-bg-base);
            border-top: 1px solid var(--ekp-border);
            z-index: 5;
        }

        #nai-ext-panel.minimized .nai-ext-footer {
            display: none;
        }

        .nai-ext-footer-strip {
            display: flex;
            flex-direction: column;
            border-top: 1px solid var(--ekp-border);
        }

        .nai-ext-footer-strip:first-child {
            border-top: none;
        }

        .nai-ext-footer-panel {
            display: none;
            padding: 7px 10px;
            background: var(--ekp-bg-base);
            border-bottom: 1px solid var(--ekp-border);
        }

        .nai-ext-footer-strip.open .nai-ext-footer-panel {
            display: block;
        }

        .nai-ext-footer-bar {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            min-height: 30px;
            background: var(--ekp-bg-base);
            user-select: none;
        }

        .nai-ext-footer-toggle {
            margin-left: auto;
            font-size: 9px;
            color: var(--ekp-fg-subtle);
            cursor: pointer;
            padding: 2px 5px;
            background: transparent;
            border: none;
            font-family: var(--ekp-font-mono);
            transition: color var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-footer-toggle:hover {
            color: var(--ekp-fg-muted);
        }

        .nai-ext-footer-strip.open .nai-ext-footer-toggle::after { content: '▼'; }
        .nai-ext-footer-strip:not(.open) .nai-ext-footer-toggle::after { content: '▲'; }

        .nai-ext-footer-preview-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 10px;
            color: var(--ekp-fg-subtle);
            font-style: italic;
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-footer-apply-btn {
            padding: 3px 8px;
            background: var(--ekp-accent);
            border: none;
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-accent-fg);
            font-size: 10px;
            font-weight: 500;
            font-family: var(--ekp-font-mono);
            cursor: pointer;
            white-space: nowrap;
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-footer-apply-btn:hover:not(:disabled) {
            background: var(--ekp-accent-hover);
        }

        .nai-ext-footer-apply-btn.secondary {
            background: var(--ekp-bg-elevated);
            color: var(--ekp-fg-primary);
            border: 1px solid var(--ekp-border);
        }

        .nai-ext-footer-apply-btn.secondary:hover:not(:disabled) {
            background: var(--ekp-bg-hover);
        }

        .nai-ext-footer-apply-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
        }

        .nai-ext-footer-queue-btn {
            background: transparent;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-muted);
            cursor: pointer;
            padding: 2px 5px;
            font-size: 10px;
            font-family: var(--ekp-font-mono);
            transition: background var(--ekp-duration-fast) var(--ekp-easing),
                        color var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-footer-queue-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
        }

        .nai-ext-footer-queue-btn:hover:not(:disabled) {
            background: var(--ekp-bg-hover);
            color: var(--ekp-fg-primary);
        }

        .nai-ext-footer-queue-counter {
            font-size: 10px;
            font-weight: 500;
            min-width: 26px;
            color: var(--ekp-fg-primary);
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-footer-queue-meta {
          font-size: 9px;
          color: var(--ekp-fg-subtle);
          min-width: 52px;
          white-space: nowrap;
          text-align: left;
          font-family: var(--ekp-font-mono);
        }

        .nai-ext-footer-label {
            font-size: 10px;
            font-weight: 500;
            color: var(--ekp-fg-muted);
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-footer-number-input {
            width: 54px;
            padding: 2px 4px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-primary);
            font-size: 10px;
            font-family: var(--ekp-font-mono);
            text-align: center;
        }

        .nai-ext-footer-number-input:focus {
            outline: none;
            border-color: var(--ekp-accent);
        }

        .nai-ext-footer-icon-btn {
            background: var(--ekp-bg-elevated);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-fg-muted);
            cursor: pointer;
            padding: 2px 6px;
            font-size: 10px;
            font-family: var(--ekp-font-mono);
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-footer-icon-btn:hover {
            background: var(--ekp-bg-hover);
            color: var(--ekp-fg-primary);
        }

        /* ============ TOKEN COUNTER ============ */
        #nai-ext-token-count {
            font-size: 10px;
            font-weight: 500;
            font-family: var(--ekp-font-mono);
            padding: 1px 5px;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            white-space: nowrap;
            color: var(--ekp-fg-muted);
        }
        #nai-ext-token-count.ok   { color: var(--ekp-success); border-color: rgba(110, 199, 139, 0.3); }
        #nai-ext-token-count.warn { color: var(--ekp-warning); border-color: rgba(224, 184, 92, 0.3); }
        #nai-ext-token-count.over { color: var(--ekp-error); border-color: rgba(224, 123, 123, 0.3); background: rgba(224, 123, 123, 0.08); }

        /* ============ MODEL SELECTOR ============ */
        .nai-ext-model-btn {
            font-size: 9px;
            padding: 2px 5px;
            background: var(--ekp-bg-elevated);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            cursor: pointer;
            font-family: var(--ekp-font-mono);
            color: var(--ekp-fg-muted);
            line-height: 1.4;
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }
        .nai-ext-model-btn:hover { background: var(--ekp-bg-hover); color: var(--ekp-fg-primary); }
        .nai-ext-model-btn.active { background: var(--ekp-bg-active); color: var(--ekp-accent); border-color: var(--ekp-accent); }

        /* ============ ANLAS CALCULATOR ============ */
        .nai-ext-anlas-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 5px;
            font-size: 11px;
        }
        .nai-ext-anlas-row label { flex: 1; color: var(--ekp-fg-muted); font-size: 10px; }
        .nai-ext-anlas-spinner {
            display: flex;
            align-items: center;
            gap: 2px;
        }
        .nai-ext-anlas-spinner button {
            width: 18px;
            height: 18px;
            line-height: 1;
            padding: 0;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            background: var(--ekp-bg-elevated);
            cursor: pointer;
            font-size: 12px;
            color: var(--ekp-fg-muted);
            font-family: var(--ekp-font-mono);
        }
        .nai-ext-anlas-spinner button:hover { background: var(--ekp-bg-hover); color: var(--ekp-fg-primary); }
        .nai-ext-anlas-spinner span {
            width: 22px;
            text-align: center;
            font-weight: 500;
            font-size: 11px;
            font-family: var(--ekp-font-mono);
            color: var(--ekp-fg-primary);
        }
        #nai-ext-anlas-cost {
            font-size: 10px;
            font-weight: 500;
            font-family: var(--ekp-font-mono);
            padding: 1px 5px;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            white-space: nowrap;
        }
        #nai-ext-anlas-cost.free { color: var(--ekp-success); border-color: rgba(110, 199, 139, 0.3); }
        #nai-ext-anlas-cost.cheap { color: var(--ekp-warning); border-color: rgba(224, 184, 92, 0.3); }
        #nai-ext-anlas-cost.costly { color: var(--ekp-error); border-color: rgba(224, 123, 123, 0.3); background: rgba(224, 123, 123, 0.08); }
        .nai-ext-opus-toggle {
            font-size: 9px;
            padding: 2px 6px;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            background: var(--ekp-bg-elevated);
            cursor: pointer;
            font-family: var(--ekp-font-mono);
            color: var(--ekp-fg-muted);
            font-weight: 500;
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }
        .nai-ext-opus-toggle.active { background: rgba(124, 58, 237, 0.2); color: #a78bfa; border-color: rgba(124, 58, 237, 0.4); }

        /* Body padding-bottom to clear footer */
        .nai-ext-body {
            padding-bottom: 100px;
        }

        /* ============ HELP MODAL ============ */
        #nai-ext-help-modal {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--ekp-bg-surface);
            z-index: 20;
            overflow-y: auto;
            padding: 12px;
        }

        #nai-ext-help-modal.open {
            display: block;
        }

        .nai-ext-help-close {
            float: right;
            background: var(--ekp-bg-elevated);
            color: var(--ekp-fg-primary);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            padding: 3px 8px;
            cursor: pointer;
            font-size: 11px;
            font-family: var(--ekp-font-mono);
            transition: background var(--ekp-duration-fast) var(--ekp-easing);
        }

        .nai-ext-help-close:hover {
            background: var(--ekp-bg-hover);
        }

        .nai-ext-help-section {
            margin-bottom: 14px;
        }

        .nai-ext-help-title {
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid var(--ekp-border);
            padding-bottom: 4px;
            margin-bottom: 8px;
            color: var(--ekp-fg-muted);
        }

        .nai-ext-help-row {
            display: flex;
            gap: 8px;
            font-size: 11px;
            margin-bottom: 3px;
            align-items: baseline;
            color: var(--ekp-fg-muted);
        }

        .nai-ext-help-syntax {
            font-family: var(--ekp-font-mono);
            font-size: 10px;
            background: var(--ekp-bg-input);
            padding: 1px 5px;
            flex-shrink: 0;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            color: var(--ekp-accent);
        }

        .nai-ext-help-code {
            font-family: var(--ekp-font-mono);
            font-size: 10px;
            background: var(--ekp-bg-input);
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            padding: 5px 7px;
            display: block;
            margin: 5px 0;
            word-break: break-all;
            color: var(--ekp-fg-primary);
        }

        .nai-ext-help-note {
            font-size: 10px;
            color: var(--ekp-fg-subtle);
            margin-top: 4px;
        }

        /* ============ BATCH IMPORT MODAL ============ */
        #nai-ext-batch-modal {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--ekp-bg-surface);
            z-index: 20;
            padding: 12px;
            overflow-y: auto;
        }

        #nai-ext-batch-modal.open {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        #nai-ext-batch-textarea {
            width: 100%;
            flex: 1;
            min-height: 180px;
            resize: vertical;
            font-family: var(--ekp-font-mono);
            font-size: 11px;
            border: 1px solid var(--ekp-border);
            border-radius: var(--ekp-radius-sm);
            padding: 8px;
            box-sizing: border-box;
            background: var(--ekp-bg-input);
            color: var(--ekp-fg-primary);
            line-height: 1.5;
        }
        #nai-ext-batch-textarea:focus {
            outline: none;
            border-color: var(--ekp-accent);
            box-shadow: var(--ekp-focus-ring);
        }

        .nai-ext-batch-hint {
            font-size: 10px;
            color: var(--ekp-fg-subtle);
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-batch-count {
            font-size: 11px;
            font-weight: 500;
            color: var(--ekp-fg-primary);
            font-family: var(--ekp-font-mono);
        }

        .nai-ext-batch-actions {
            display: flex;
            gap: 6px;
        }

        /* ============ REDUCED MOTION ============ */
        @media (prefers-reduced-motion: reduce) {
            #nai-ext-panel,
            .nai-ext-template-item,
            .nai-ext-btn,
            .nai-ext-tab,
            .nai-ext-progress-fill {
                transition: none;
            }
            @keyframes pulse { 0%, 100% { opacity: 1; } }
        }
    `;

  // ============================================
  // STATE
  // ============================================
  let state = {
    // Positive templates backed by library.json
    templates: [],
    // Negative templates backed by library.json
    negativeTemplates: [],
    // Dynamic placeholders keyed by shortName. Each array carries metadata fields.
    placeholders: {
      artist: [],
      character: [],
      style: [],
    },
    // Template categories with label-keyed metadata.
    categories: ["general", "portraits", "landscapes"],
    categoryMeta: {},
    // Currently selected items
    selectedTemplates: [], // Array of template indices for multi-select
    selectedPlaceholders: {}, // { artist: [0, 1], character: [0] }
    placeholderRenderLimit: {}, // { artist: 200 }
    currentPlaceholderTab: "artist",
    currentCategoryFilter: "all",
    // Placeholder search state
    placeholderSearchQuery: "",
    // Queue state
    queue: [],
    queueEntries: [],
    failedQueueItems: [], // Track indices of failed generations
    isQueueRunning: false,
    isQueuePaused: false,
    currentQueueIndex: 0,
    savedQueueSnapshot: null,
    lastSessionSavedAt: 0,
    // Settings
    settings: {
      delayBetweenGenerations: 2000,
      autoStartQueue: false,
      freeSafeMode: false,
      randomizerEnabled: false,
      currentModel: "v45_full",
      opusPlan: false,
      preciseRefCount: 0,
      vibeCount: 0,
    },
    // Weight syntax state
    weightPresets: {}, // Custom weight presets
    // Randomizer state
    randomizerVariations: [], // Current randomizer preview variations
    // Multi-character slots
    charSlots: ["base", "char1", "char2"],
    selectedCharSlot: "base",
  };

  const queueTiming = {
    startedAt: 0,
    elapsedRunningMs: 0,
    lastResumedAt: 0,
    currentCycleStartedAt: 0,
    cycleDurations: [],
    completedRunMs: 0,
    tickerId: null,
  };

  // ============================================
  // STORAGE
  // ============================================
  const Storage = {
    get(key, defaultValue = null) {
      try {
        if (typeof GM_getValue !== "undefined") {
          const val = GM_getValue(key, null);
          return val !== null ? val : defaultValue;
        }
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error("Storage.get error:", e);
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        if (typeof GM_setValue !== "undefined") {
          GM_setValue(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (e) {
        console.error("Storage.set error:", e);
      }
    },
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function createEntityId(prefix) {
    const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let time = Date.now();
    let encodedTime = "";

    for (let index = 0; index < 10; index++) {
      encodedTime = alphabet[time % 32] + encodedTime;
      time = Math.floor(time / 32);
    }

    let encodedRandom = "";
    for (let index = 0; index < 16; index++) {
      encodedRandom += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return `${prefix}_${encodedTime}${encodedRandom}`;
  }

  function humanizeToken(token) {
    return String(token || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function getTimestampValue(value) {
    const parsed = Date.parse(value || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getDefaultCategoryLabels() {
    return DEFAULT_CATEGORY_PRESETS.map((category) => category.label);
  }

  function getDefaultCategoryColor(label) {
    const preset = DEFAULT_CATEGORY_PRESETS.find(
      (category) => category.label === label,
    );
    return preset?.color || "#7C8796";
  }

  function modelKeyToSchemaValue(modelKey) {
    return MODEL_STORAGE_KEY_MAP[modelKey] || "v4-5-full";
  }

  function schemaValueToModelKey(modelValue) {
    return MODEL_UI_KEY_MAP[modelValue] || "v45_full";
  }

  function ensureCategoryMeta(label, options = {}) {
    const normalizedLabel = String(label || "general").trim().toLowerCase();
    const existing = state.categoryMeta[normalizedLabel];
    if (existing) {
      if (options.color && !existing.color) existing.color = options.color;
      return existing;
    }

    const meta = {
      id: options.id || createEntityId("cat"),
      label: normalizedLabel,
      color: options.color || getDefaultCategoryColor(normalizedLabel),
      createdAt: options.createdAt || nowIso(),
    };

    state.categoryMeta[normalizedLabel] = meta;
    if (!state.categories.includes(normalizedLabel)) {
      state.categories.push(normalizedLabel);
    }
    return meta;
  }

  function getCategoryLabelById(categoryId) {
    if (!categoryId) return "general";
    const match = Object.values(state.categoryMeta).find(
      (meta) => meta.id === categoryId,
    );
    return match?.label || "general";
  }

  function ensurePlaceholderBucket(shortName, options = {}) {
    const key = String(shortName || "").trim().toLowerCase();
    if (!key) return null;

    let bucket = state.placeholders[key];
    if (!Array.isArray(bucket)) {
      bucket = [];
      state.placeholders[key] = bucket;
    }

    const createdAt = options.createdAt || bucket.createdAt || nowIso();
    bucket.id = options.id || bucket.id || createEntityId("ph");
    bucket.shortName = key;
    bucket.label = options.label || bucket.label || humanizeToken(key);
    bucket.createdAt = bucket.createdAt || createdAt;
    bucket.updatedAt = options.updatedAt || bucket.updatedAt || bucket.createdAt;
    return bucket;
  }

  function ensureDefaultPlaceholderBuckets() {
    CONFIG.DEFAULT_PLACEHOLDERS.forEach((type) => ensurePlaceholderBucket(type));
    if (!state.currentPlaceholderTab || !state.placeholders[state.currentPlaceholderTab]) {
      state.currentPlaceholderTab =
        Object.keys(state.placeholders)[0] || CONFIG.DEFAULT_PLACEHOLDERS[0];
    }
  }

  function touchPlaceholderBucket(shortName) {
    const bucket = ensurePlaceholderBucket(shortName);
    if (bucket) bucket.updatedAt = nowIso();
    return bucket;
  }

  function getTemplateLinkedNegativeId(template) {
    if (!template || typeof template !== "object") return null;
    return template.linkedNegativeId ?? template.negativeId ?? null;
  }

  function setTemplateLinkedNegativeId(template, linkedNegativeId) {
    if (!template || typeof template !== "object") return;
    template.linkedNegativeId = linkedNegativeId || null;
    delete template.negativeId;
    template.updatedAt = nowIso();
  }

  function findNegativeTemplateById(templateId) {
    return state.negativeTemplates.find((template) => template.id === templateId) || null;
  }

  function findNegativeTemplateIndexById(templateId) {
    return state.negativeTemplates.findIndex((template) => template.id === templateId);
  }

  function normalizeTemplateRecord(template, type = "positive", legacyNegativeIdMap = null) {
    const source =
      typeof template === "object" && template !== null
        ? template
        : { content: String(template || "") };
    const createdAt = source.createdAt || nowIso();
    const categoryLabel =
      type === "positive"
        ? String(
            source.category || getCategoryLabelById(source.categoryId) || "general",
          )
            .trim()
            .toLowerCase() || "general"
        : "";
    const categoryMeta =
      type === "positive" ? ensureCategoryMeta(categoryLabel || "general") : null;
    const linkedNegativeId =
      type === "positive"
        ? source.linkedNegativeId ||
          (legacyNegativeIdMap && Number.isInteger(source.negativeId)
            ? legacyNegativeIdMap.get(source.negativeId) || null
            : null)
        : null;

    return {
      id: source.id || createEntityId("tpl"),
      type,
      name: typeof source.name === "string" ? source.name : "",
      content:
        typeof source.content === "string"
          ? source.content
          : String(source.content || ""),
      category: type === "positive" ? categoryMeta.label : "",
      categoryId: type === "positive" ? categoryMeta.id : null,
      linkedNegativeId,
      tags: Array.isArray(source.tags) ? [...source.tags] : [],
      createdAt,
      updatedAt: source.updatedAt || createdAt,
    };
  }

  function serializeTemplateRecord(template, type = "positive") {
    const record = normalizeTemplateRecord(template, type);
    return {
      id: record.id,
      type,
      name: record.name,
      content: record.content,
      categoryId: type === "positive" ? record.categoryId : null,
      linkedNegativeId: type === "positive" ? getTemplateLinkedNegativeId(record) : null,
      tags: Array.isArray(record.tags) ? [...record.tags] : [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  function buildLibraryDocument() {
    const exportedAt = nowIso();
    const templates = [
      ...state.templates.map((template) => serializeTemplateRecord(template, "positive")),
      ...state.negativeTemplates.map((template) => serializeTemplateRecord(template, "negative")),
    ];
    const placeholders = {};

    Object.keys(state.placeholders)
      .sort()
      .forEach((shortName) => {
        const bucket = ensurePlaceholderBucket(shortName);
        placeholders[bucket.id] = {
          id: bucket.id,
          shortName,
          label: bucket.label || humanizeToken(shortName),
          values: [...bucket],
          createdAt: bucket.createdAt || exportedAt,
          updatedAt: bucket.updatedAt || bucket.createdAt || exportedAt,
        };
      });

    const categories = state.categories.map((label) => {
      const meta = ensureCategoryMeta(label);
      return {
        id: meta.id,
        label: meta.label,
        color: meta.color,
        createdAt: meta.createdAt,
      };
    });

    return {
      schemaVersion: 4,
      exportedAt,
      exportedBy: `ekphrasis-studio/${CONFIG.VERSION}`,
      templates,
      placeholders,
      categories,
    };
  }

  function hydrateLibraryState(libraryDoc) {
    state.templates = [];
    state.negativeTemplates = [];
    state.placeholders = {};
    state.categories = [];
    state.categoryMeta = {};

    const categories =
      Array.isArray(libraryDoc?.categories) && libraryDoc.categories.length > 0
        ? libraryDoc.categories
        : DEFAULT_CATEGORY_PRESETS.map((category) => ({
            ...category,
            id: createEntityId("cat"),
            createdAt: nowIso(),
          }));

    categories.forEach((category) => {
      ensureCategoryMeta(category.label, category);
    });
    ensureCategoryMeta("general");

    const libraryTemplates = Array.isArray(libraryDoc?.templates)
      ? libraryDoc.templates
      : [];

    state.negativeTemplates = libraryTemplates
      .filter((template) => template?.type === "negative")
      .map((template) => normalizeTemplateRecord(template, "negative"));

    state.templates = libraryTemplates
      .filter((template) => template?.type !== "negative")
      .map((template) => normalizeTemplateRecord(template, "positive"));

    const placeholders =
      libraryDoc?.placeholders && typeof libraryDoc.placeholders === "object"
        ? libraryDoc.placeholders
        : {};

    Object.values(placeholders).forEach((placeholder) => {
      if (!placeholder || typeof placeholder !== "object") return;
      const shortName = String(placeholder.shortName || "").trim().toLowerCase();
      if (!shortName) return;
      const bucket = ensurePlaceholderBucket(shortName, placeholder);
      bucket.splice(
        0,
        bucket.length,
        ...(Array.isArray(placeholder.values)
          ? placeholder.values.map((value) => String(value))
          : []),
      );
      bucket.createdAt = placeholder.createdAt || bucket.createdAt || nowIso();
      bucket.updatedAt = placeholder.updatedAt || bucket.updatedAt || bucket.createdAt;
    });

    ensureDefaultPlaceholderBuckets();
  }

  function buildLibraryDocumentFromParts(parts = {}) {
    const exportedAt = nowIso();
    const categories = [];
    const categoryByLabel = new Map();

    const ensureLocalCategory = (label, options = {}) => {
      const normalizedLabel = String(label || "general").trim().toLowerCase() || "general";
      if (categoryByLabel.has(normalizedLabel)) return categoryByLabel.get(normalizedLabel);
      const category = {
        id: options.id || createEntityId("cat"),
        label: normalizedLabel,
        color: options.color || getDefaultCategoryColor(normalizedLabel),
        createdAt: options.createdAt || exportedAt,
      };
      categories.push(category);
      categoryByLabel.set(normalizedLabel, category);
      return category;
    };

    (Array.isArray(parts.categories) && parts.categories.length > 0
      ? parts.categories
      : getDefaultCategoryLabels()
    ).forEach((category) => {
      if (typeof category === "string") {
        ensureLocalCategory(category);
        return;
      }
      ensureLocalCategory(category?.label, category || {});
    });

    const negativeTemplates = (Array.isArray(parts.negativeTemplates)
      ? parts.negativeTemplates
      : []
    ).map((template) => {
      const source =
        typeof template === "object" && template !== null
          ? template
          : { content: String(template || "") };
      const createdAt = source.createdAt || exportedAt;
      return {
        id: source.id || createEntityId("tpl"),
        type: "negative",
        name: typeof source.name === "string" ? source.name : "",
        content:
          typeof source.content === "string"
            ? source.content
            : String(source.content || ""),
        categoryId: null,
        linkedNegativeId: null,
        tags: Array.isArray(source.tags) ? [...source.tags] : [],
        createdAt,
        updatedAt: source.updatedAt || createdAt,
      };
    });

    const negativeIdMap = new Map(
      negativeTemplates.map((template, index) => [index, template.id]),
    );

    const positiveTemplates = (Array.isArray(parts.templates) ? parts.templates : []).map(
      (template) => {
        const source =
          typeof template === "object" && template !== null
            ? template
            : { content: String(template || "") };
        const category = ensureLocalCategory(
          source.category || getCategoryLabelById(source.categoryId) || "general",
        );
        const createdAt = source.createdAt || exportedAt;
        return {
          id: source.id || createEntityId("tpl"),
          type: "positive",
          name: typeof source.name === "string" ? source.name : "",
          content:
            typeof source.content === "string"
              ? source.content
              : String(source.content || ""),
          categoryId: source.categoryId || category.id,
          linkedNegativeId:
            source.linkedNegativeId ||
            (Number.isInteger(source.negativeId)
              ? negativeIdMap.get(source.negativeId) || null
              : null),
          tags: Array.isArray(source.tags) ? [...source.tags] : [],
          createdAt,
          updatedAt: source.updatedAt || createdAt,
        };
      },
    );

    const placeholders = {};
    const placeholderValues =
      parts.placeholders && typeof parts.placeholders === "object"
        ? parts.placeholders
        : {};

    Object.entries(placeholderValues).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const id = createEntityId("ph");
        placeholders[id] = {
          id,
          shortName: key.trim().toLowerCase(),
          label: humanizeToken(key),
          values: value.map((item) => String(item)),
          createdAt: exportedAt,
          updatedAt: exportedAt,
        };
        return;
      }

      if (!value || typeof value !== "object") return;
      const id = value.id || createEntityId("ph");
      const shortName = String(value.shortName || key).trim().toLowerCase();
      placeholders[id] = {
        id,
        shortName,
        label: value.label || humanizeToken(shortName),
        values: Array.isArray(value.values)
          ? value.values.map((item) => String(item))
          : [],
        createdAt: value.createdAt || exportedAt,
        updatedAt: value.updatedAt || value.createdAt || exportedAt,
      };
    });

    CONFIG.DEFAULT_PLACEHOLDERS.forEach((shortName) => {
      const hasPlaceholder = Object.values(placeholders).some(
        (placeholder) => placeholder.shortName === shortName,
      );
      if (hasPlaceholder) return;
      const id = createEntityId("ph");
      placeholders[id] = {
        id,
        shortName,
        label: humanizeToken(shortName),
        values: [],
        createdAt: exportedAt,
        updatedAt: exportedAt,
      };
    });

    return {
      schemaVersion: 4,
      exportedAt,
      exportedBy: `ekphrasis-studio/${CONFIG.VERSION}`,
      templates: [...positiveTemplates, ...negativeTemplates],
      placeholders,
      categories,
    };
  }

  function mergeLibraryDocuments(currentDoc, incomingDoc) {
    const exportedAt = nowIso();
    const categoryRemap = new Map();
    const categories = [];
    const categoryByLabel = new Map();

    const registerCategory = (category) => {
      if (!category) return;
      const normalizedLabel = String(category.label || "general").trim().toLowerCase() || "general";
      const existing = categoryByLabel.get(normalizedLabel);
      if (existing) {
        if (category.id) categoryRemap.set(category.id, existing.id);
        return existing;
      }
      const registered = {
        id: category.id || createEntityId("cat"),
        label: normalizedLabel,
        color: category.color || getDefaultCategoryColor(normalizedLabel),
        createdAt: category.createdAt || exportedAt,
      };
      categories.push(registered);
      categoryByLabel.set(normalizedLabel, registered);
      if (category.id) categoryRemap.set(category.id, registered.id);
      return registered;
    };

    [...(currentDoc.categories || []), ...(incomingDoc.categories || [])].forEach(registerCategory);
    getDefaultCategoryLabels().forEach((label) => registerCategory({ label }));

    const templatesById = new Map();
    [...(currentDoc.templates || []), ...(incomingDoc.templates || [])].forEach((template) => {
      if (!template || typeof template !== "object") return;
      const normalized = { ...template };
      if (normalized.type !== "negative") {
        normalized.categoryId =
          categoryRemap.get(normalized.categoryId) || normalized.categoryId || registerCategory({ label: "general" }).id;
      } else {
        normalized.categoryId = null;
        normalized.linkedNegativeId = null;
      }

      const existing = templatesById.get(normalized.id);
      if (!existing) {
        templatesById.set(normalized.id, normalized);
        return;
      }

      const incomingStamp = getTimestampValue(normalized.updatedAt || normalized.createdAt);
      const existingStamp = getTimestampValue(existing.updatedAt || existing.createdAt);
      if (incomingStamp >= existingStamp) {
        templatesById.set(normalized.id, normalized);
      }
    });

    const placeholdersByShortName = new Map();
    const registerPlaceholder = (placeholder) => {
      if (!placeholder || typeof placeholder !== "object") return;
      const shortName = String(placeholder.shortName || "").trim().toLowerCase();
      if (!shortName) return;
      const existing = placeholdersByShortName.get(shortName);
      const values = Array.from(
        new Set(
          (Array.isArray(existing?.values) ? existing.values : [])
            .concat(Array.isArray(placeholder.values) ? placeholder.values : [])
            .map((value) => String(value)),
        ),
      );
      if (!existing) {
        placeholdersByShortName.set(shortName, {
          id: placeholder.id || createEntityId("ph"),
          shortName,
          label: placeholder.label || humanizeToken(shortName),
          values,
          createdAt: placeholder.createdAt || exportedAt,
          updatedAt: placeholder.updatedAt || placeholder.createdAt || exportedAt,
        });
        return;
      }

      const incomingStamp = getTimestampValue(placeholder.updatedAt || placeholder.createdAt);
      const existingStamp = getTimestampValue(existing.updatedAt || existing.createdAt);
      const preferred = incomingStamp >= existingStamp ? placeholder : existing;
      placeholdersByShortName.set(shortName, {
        id: existing.id || placeholder.id || createEntityId("ph"),
        shortName,
        label: preferred.label || humanizeToken(shortName),
        values,
        createdAt: existing.createdAt || placeholder.createdAt || exportedAt,
        updatedAt: preferred.updatedAt || preferred.createdAt || exportedAt,
      });
    };

    Object.values(currentDoc.placeholders || {}).forEach(registerPlaceholder);
    Object.values(incomingDoc.placeholders || {}).forEach(registerPlaceholder);
    CONFIG.DEFAULT_PLACEHOLDERS.forEach((shortName) => {
      registerPlaceholder({ shortName, label: humanizeToken(shortName), values: [] });
    });

    const placeholders = {};
    placeholdersByShortName.forEach((placeholder) => {
      placeholders[placeholder.id] = placeholder;
    });

    return {
      schemaVersion: 4,
      exportedAt,
      exportedBy: `ekphrasis-studio/${CONFIG.VERSION}`,
      templates: [...templatesById.values()],
      placeholders,
      categories,
    };
  }

  function createDefaultSettingsDocument() {
    return {
      schemaVersion: 4,
      ui: {
        theme: "dark",
        panelPosition: "right",
        panelWidth: 360,
        panelMinimized: false,
        showKeyboardHints: true,
        showT5TokenCount: true,
      },
      queue: {
        delayMs: CONFIG.DEFAULT_DELAY,
        delayJitterMs: 0,
        stopOnError: false,
        imagesPerCall: 1,
        retryOnFailure: false,
        retryMaxAttempts: 0,
      },
      model: {
        preferred: "v4-5-full",
        autoApplyQualityTags: false,
        qualityTagsByModel: {
          "v4-5-full": QUALITY_TAG_PRESETS.v45_full.tags,
          "v4-5-curated": QUALITY_TAG_PRESETS.v45_curated.tags,
          "v4-full": QUALITY_TAG_PRESETS.v4_full.tags,
          "v4-curated": QUALITY_TAG_PRESETS.v4_curated.tags,
          v3: QUALITY_TAG_PRESETS.v3.tags,
        },
      },
      anlas: {
        trackCost: true,
        warnAboveThreshold: 100,
        opusFreePlan: false,
        preciseRefCount: 0,
        vibeCount: 0,
      },
      core: {
        outputDir: "~/Pictures/ekphrasis",
        naiCachePath: null,
        scrapeBrowserCache: false,
      },
      studio: {
        autoStartQueue: false,
        freeSafeMode: false,
        randomizerEnabled: CONFIG.RANDOMIZER_DEFAULT_ENABLED,
      },
    };
  }

  function buildSettingsDocumentFromLegacySettings(legacySettings = {}) {
    const settingsDoc = createDefaultSettingsDocument();
    settingsDoc.queue.delayMs = Number.isFinite(legacySettings.delayBetweenGenerations)
      ? legacySettings.delayBetweenGenerations
      : CONFIG.DEFAULT_DELAY;
    settingsDoc.model.preferred = modelKeyToSchemaValue(
      legacySettings.currentModel || "v45_full",
    );
    settingsDoc.anlas.opusFreePlan = !!legacySettings.opusPlan;
    settingsDoc.anlas.preciseRefCount = Number.isFinite(legacySettings.preciseRefCount)
      ? legacySettings.preciseRefCount
      : 0;
    settingsDoc.anlas.vibeCount = Number.isFinite(legacySettings.vibeCount)
      ? legacySettings.vibeCount
      : 0;
    settingsDoc.studio.autoStartQueue = !!legacySettings.autoStartQueue;
    settingsDoc.studio.freeSafeMode = !!legacySettings.freeSafeMode;
    settingsDoc.studio.randomizerEnabled =
      typeof legacySettings.randomizerEnabled === "boolean"
        ? legacySettings.randomizerEnabled
        : CONFIG.RANDOMIZER_DEFAULT_ENABLED;
    return settingsDoc;
  }

  function buildSettingsDocument() {
    const settingsDoc = createDefaultSettingsDocument();
    settingsDoc.queue.delayMs = state.settings.delayBetweenGenerations;
    settingsDoc.model.preferred = modelKeyToSchemaValue(state.settings.currentModel);
    settingsDoc.anlas.opusFreePlan = !!state.settings.opusPlan;
    settingsDoc.anlas.preciseRefCount = Number.isFinite(state.settings.preciseRefCount)
      ? state.settings.preciseRefCount
      : 0;
    settingsDoc.anlas.vibeCount = Number.isFinite(state.settings.vibeCount)
      ? state.settings.vibeCount
      : 0;
    settingsDoc.studio.autoStartQueue = !!state.settings.autoStartQueue;
    settingsDoc.studio.freeSafeMode = !!state.settings.freeSafeMode;
    settingsDoc.studio.randomizerEnabled = !!state.settings.randomizerEnabled;
    return settingsDoc;
  }

  function applySettingsDocument(settingsDoc) {
    const source = settingsDoc && typeof settingsDoc === "object"
      ? settingsDoc
      : createDefaultSettingsDocument();

    state.settings = {
      delayBetweenGenerations: Number.isFinite(source.queue?.delayMs)
        ? source.queue.delayMs
        : CONFIG.DEFAULT_DELAY,
      autoStartQueue: !!source.studio?.autoStartQueue,
      freeSafeMode: !!source.studio?.freeSafeMode,
      randomizerEnabled:
        typeof source.studio?.randomizerEnabled === "boolean"
          ? source.studio.randomizerEnabled
          : CONFIG.RANDOMIZER_DEFAULT_ENABLED,
      currentModel: schemaValueToModelKey(source.model?.preferred),
      opusPlan: !!source.anlas?.opusFreePlan,
      preciseRefCount: Number.isFinite(source.anlas?.preciseRefCount)
        ? source.anlas.preciseRefCount
        : 0,
      vibeCount: Number.isFinite(source.anlas?.vibeCount)
        ? source.anlas.vibeCount
        : 0,
    };
  }

  function isV4LibraryDocument(value) {
    return !!value && value.schemaVersion === 4 && (
      Array.isArray(value.templates) ||
      typeof value.placeholders === "object" ||
      Array.isArray(value.categories)
    );
  }

  function isV4SettingsDocument(value) {
    return !!value && value.schemaVersion === 4 && !!value.queue && !!value.model;
  }

  function isV4SessionDocument(value) {
    return !!value && value.schemaVersion === 4 && !!value.queue;
  }

  function normalizeQueueEntry(entry) {
    const source = entry && typeof entry === "object"
      ? entry
      : { resolvedPrompt: String(entry || "") };
    const createdAt = source.createdAt || nowIso();
    const allowedStatuses = ["pending", "running", "done", "failed", "skipped"];
    return {
      id: source.id || createEntityId("queue"),
      templateId: source.templateId || null,
      resolvedPrompt:
        typeof source.resolvedPrompt === "string"
          ? source.resolvedPrompt
          : String(source.resolvedPrompt || ""),
      negativePrompt:
        typeof source.negativePrompt === "string" ? source.negativePrompt : null,
      model:
        typeof source.model === "string"
          ? source.model
          : modelKeyToSchemaValue(state.settings.currentModel),
      status: allowedStatuses.includes(source.status) ? source.status : "pending",
      createdAt,
      startedAt: source.startedAt || null,
      completedAt: source.completedAt || null,
      error: source.error || null,
    };
  }

  function createQueueEntry(resolvedPrompt, template = null) {
    const linkedNegativeId = template ? getTemplateLinkedNegativeId(template) : null;
    const negativeTemplate = linkedNegativeId ? findNegativeTemplateById(linkedNegativeId) : null;
    return normalizeQueueEntry({
      resolvedPrompt,
      templateId: template?.id || null,
      negativePrompt: negativeTemplate?.content || null,
      model: modelKeyToSchemaValue(state.settings.currentModel),
      status: "pending",
    });
  }

  function ensureQueueEntriesAligned() {
    if (!Array.isArray(state.queueEntries)) {
      state.queueEntries = [];
    }
    if (state.queueEntries.length === state.queue.length) return;
    state.queueEntries = state.queue.map((prompt, index) => {
      const existing = state.queueEntries[index];
      if (existing && existing.resolvedPrompt === prompt) {
        return normalizeQueueEntry(existing);
      }
      return createQueueEntry(prompt);
    });
  }

  function enqueuePrompts(prompts, template = null) {
    prompts.forEach((prompt) => {
      state.queue.push(prompt);
      state.queueEntries.push(createQueueEntry(prompt, template));
    });
  }

  function removeQueueEntryAt(index) {
    state.queue.splice(index, 1);
    state.queueEntries.splice(index, 1);
    state.failedQueueItems = state.failedQueueItems
      .filter((itemIndex) => itemIndex !== index)
      .map((itemIndex) => (itemIndex > index ? itemIndex - 1 : itemIndex));
  }

  function createEmptySessionDocument() {
    return {
      schemaVersion: 4,
      updatedAt: nowIso(),
      lastUsedTemplateId: null,
      queue: {
        items: [],
        running: false,
        currentIndex: 0,
      },
    };
  }

  function buildSessionDocumentFromLegacyQueueState(legacyQueueState = null) {
    if (!legacyQueueState || !Array.isArray(legacyQueueState.queue)) {
      return createEmptySessionDocument();
    }

    const updatedAt = Number.isFinite(legacyQueueState.savedAt)
      ? new Date(legacyQueueState.savedAt).toISOString()
      : nowIso();
    const currentIndex = Number.isFinite(legacyQueueState.currentQueueIndex)
      ? legacyQueueState.currentQueueIndex
      : 0;
    const failedItems = Array.isArray(legacyQueueState.failedQueueItems)
      ? legacyQueueState.failedQueueItems
      : [];
    const items = legacyQueueState.queue.map((prompt, index) => {
      const status = failedItems.includes(index)
        ? "failed"
        : index < currentIndex
          ? "done"
          : "pending";
      return normalizeQueueEntry({
        resolvedPrompt: prompt,
        model: modelKeyToSchemaValue(state.settings.currentModel),
        status,
        createdAt: updatedAt,
        startedAt: status === "pending" ? null : updatedAt,
        completedAt: status === "pending" ? null : updatedAt,
        error: status === "failed" ? "generation-failed" : null,
      });
    });

    return {
      schemaVersion: 4,
      updatedAt,
      lastUsedTemplateId: null,
      queue: {
        items,
        running: false,
        currentIndex,
      },
    };
  }

  function buildSessionDocument() {
    ensureQueueEntriesAligned();
    const selectedTemplate =
      state.selectedTemplates.length > 0
        ? state.templates[state.selectedTemplates[0]]
        : null;
    return {
      schemaVersion: 4,
      updatedAt: nowIso(),
      lastUsedTemplateId: selectedTemplate?.id || null,
      queue: {
        items: state.queueEntries.map((entry) => normalizeQueueEntry(entry)),
        running: state.isQueueRunning && !state.isQueuePaused,
        currentIndex: state.currentQueueIndex,
      },
    };
  }

  function buildQueueResumeSnapshotFromSession(sessionDoc) {
    if (!isV4SessionDocument(sessionDoc)) return null;
    const items = Array.isArray(sessionDoc.queue?.items)
      ? sessionDoc.queue.items.map((item) => normalizeQueueEntry(item))
      : [];
    if (items.length === 0) return null;
    const currentIndex = Number.isFinite(sessionDoc.queue?.currentIndex)
      ? Math.max(0, Math.min(sessionDoc.queue.currentIndex, items.length))
      : 0;
    return {
      queue: items.map((item) => item.resolvedPrompt),
      queueEntries: items,
      currentQueueIndex: currentIndex,
      failedQueueItems: items.reduce((list, item, index) => {
        if (item.status === "failed") list.push(index);
        return list;
      }, []),
      savedAt: getTimestampValue(sessionDoc.updatedAt) || Date.now(),
    };
  }

  // ============================================
  // NOVELAI INTERACTION
  // ============================================
  const NovelAI = {
    getPromptEditor() {
      const editors = document.querySelectorAll(
        '.ProseMirror[contenteditable="true"]',
      );
      return editors[0] || null;
    },

    getNegativePromptEditor() {
      const editors = document.querySelectorAll(
        '.ProseMirror[contenteditable="true"]',
      );
      // Separate layout: two editors visible simultaneously
      if (editors.length >= 2) return editors[1];
      // Combined/tabs layout: find by label proximity ("Undesired Content")
      return this._findEditorNearLabel(["Undesired Content", "Negative Prompt"]);
    },

    // Find a ProseMirror editor that lives inside a section labeled with one of the given labels
    _findEditorNearLabel(labels) {
      const candidates = document.querySelectorAll("span, label");
      for (const el of candidates) {
        if (el.childElementCount > 0) continue;
        if (!labels.includes(el.textContent.trim())) continue;
        let container = el.parentElement;
        for (let depth = 0; depth < 8; depth++) {
          if (!container) break;
          const ed = container.querySelector('.ProseMirror[contenteditable="true"]');
          if (ed) return ed;
          container = container.parentElement;
        }
      }
      return null;
    },

    // Find NAI's own tab button for the prompt area (positive or negative)
    _findNAIPromptTab(type) {
      const labels = type === "negative"
        ? ["Undesired Content", "Negative Prompt", "Negative"]
        : ["Prompt", "Description", "Positive Prompt", "Positive"];
      const tabs = document.querySelectorAll('[role="tab"]');
      for (const tab of tabs) {
        const t = tab.textContent.trim();
        if (labels.includes(t) || labels.some((l) => t.includes(l) && t.length < l.length + 12)) {
          return tab;
        }
      }
      return null;
    },

    getGenerateButton() {
      const buttons = document.querySelectorAll("button");
      for (const btn of buttons) {
        if (btn.textContent.includes("Generate")) {
          return btn;
        }
      }
      return null;
    },

    getStepsInput() {
      const numberInputs = Array.from(document.querySelectorAll('input[type="number"]'));
      const isStepInput = (el) => {
        const attrs = [
          el.getAttribute("aria-label") || "",
          el.getAttribute("name") || "",
          el.getAttribute("id") || "",
          el.getAttribute("placeholder") || "",
          el.title || "",
        ]
          .join(" ")
          .toLowerCase();

        if (attrs.includes("step")) return true;
        const containerText = (el.closest("div")?.textContent || "").toLowerCase();
        return containerText.includes("step");
      };

      return numberInputs.find(isStepInput) || null;
    },

    setNumericInputValue(inputEl, value) {
      if (!inputEl) return false;
      const next = String(value);
      if (inputEl.value === next) return true;

      inputEl.value = next;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },

    enforceFreeSafeSteps(maxSteps = CONFIG.FREE_SAFE_MAX_STEPS) {
      // FREE-safe mode behavior: always force the steps input to the safe ceiling.
      // When enabled, 12 becomes 28 and 50 also becomes 28.
      const input = this.getStepsInput();
      if (!input) return { ok: false, reason: "steps-input-not-found" };

      const current = parseInt(input.value, 10);
      if (Number.isFinite(current) && current === maxSteps) {
        return { ok: true, changed: false, value: current };
      }

      this.setNumericInputValue(input, maxSteps);
      return { ok: true, changed: true, previousValue: current, value: maxSteps };
    },

    getCurrentPrompt() {
      const editor = this.getPromptEditor();
      if (!editor) return "";
      return editor.innerText.trim();
    },

    setPrompt(text) {
      const editor = this.getPromptEditor();
      if (!editor) {
        console.error("NAI Ext: Could not find prompt editor");
        return false;
      }

      editor.innerHTML = "";
      const p = document.createElement("p");
      p.textContent = text;
      editor.appendChild(p);

      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));

      editor.focus();
      setTimeout(() => {
        editor.blur();
        editor.focus();
      }, 50);

      return true;
    },

    setNegativePrompt(text) {
      const editors = document.querySelectorAll('.ProseMirror[contenteditable="true"]');
      let editor = editors[1] || null;
      let needsTabRestore = false;

      if (!editor) {
        // Combined/tabs layout: switch NAI's negative prompt tab
        const negTab = this._findNAIPromptTab("negative");
        if (negTab) {
          negTab.click();
          needsTabRestore = true;
        }
        editor = document.querySelectorAll('.ProseMirror[contenteditable="true"]')[0] || null;
      }

      if (!editor) {
        console.warn("NAI Ext: Could not find negative prompt editor");
        return false;
      }

      editor.innerHTML = "";
      const p = document.createElement("p");
      p.textContent = text;
      editor.appendChild(p);

      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));

      if (needsTabRestore) {
        setTimeout(() => {
          const posTab = this._findNAIPromptTab("positive");
          if (posTab) posTab.click();
        }, 250);
      }

      return true;
    },

    clickGenerate() {
      const btn = this.getGenerateButton();
      if (!btn) {
        console.error("NAI Ext: Could not find generate button");
        return false;
      }

      if (btn.disabled) {
        console.log("NAI Ext: Generate button is disabled");
        return false;
      }

      btn.click();
      return true;
    },

    isGenerating() {
      const btn = this.getGenerateButton();
      if (!btn) return false;

      if (btn.disabled) return true;

      const hasSpinner =
        btn.querySelector('svg[class*="spin"]') ||
        btn.querySelector('[class*="loading"]');
      if (hasSpinner) return true;

      const text = btn.textContent;
      if (text.includes("Generating") || text.includes("Loading")) return true;

      return false;
    },

    waitForGenerationComplete() {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isGenerating()) {
            clearInterval(checkInterval);
            setTimeout(() => {
              const hasError = this.hasErrorPopup();
              resolve({ success: !hasError, error: hasError });
            }, 300);
          }
        }, CONFIG.GENERATION_CHECK_INTERVAL);
      });
    },

    hasErrorPopup() {
      const errorSelectors = [
        '[class*="toast"][class*="error"]',
        '[class*="notification"][class*="error"]',
        '[class*="alert"][class*="error"]',
        '[class*="Toast"]',
        '[class*="Toastify"]',
        '[role="alert"]',
      ];

      for (const selector of errorSelectors) {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
          const text = el.textContent.toLowerCase();
          if (
            text.includes("error") ||
            text.includes("failed") ||
            text.includes("limit") ||
            text.includes("insufficient") ||
            text.includes("timeout") ||
            text.includes("unavailable")
          ) {
            return true;
          }
        }
      }

      const allToasts = document.querySelectorAll(
        '[class*="toast"], [class*="Toast"], [class*="notification"]',
      );
      for (const toast of allToasts) {
        if (toast.offsetParent !== null) {
          const text = toast.textContent.toLowerCase();
          if (text.includes("error") || text.includes("failed")) {
            return true;
          }
        }
      }

      return false;
    },

    // Auto-detect Anlas-relevant factors from NAI's live DOM
    detectAnlasFactors() {
      const result = { vibeCount: null, preciseRefCount: null, opusPlan: null, isFree: null };

      // Helper: count image thumbnails near a section labeled with one of the given strings
      const countImagesNearLabel = (labels) => {
        const candidates = document.querySelectorAll("span, div[class], label");
        for (const el of candidates) {
          if (el.childElementCount !== 0) continue;
          if (!labels.includes(el.textContent.trim())) continue;
          let container = el.parentElement;
          for (let i = 0; i < 6; i++) {
            if (!container) break;
            const imgs = container.querySelectorAll(
              'img[src]:not([src=""]), [class*="thumbnail"], [class*="preview-img"], [class*="reference-img"]'
            );
            if (imgs.length > 0) return imgs.length;
            container = container.parentElement;
          }
          return 0;
        }
        return null;
      };

      // --- Vibe Transfer count ---
      result.vibeCount = countImagesNearLabel(["Vibe Transfer"]) ?? 0;

      // --- Precise Reference count ---
      result.preciseRefCount = countImagesNearLabel(["Reference Image", "Precise Reference", "Reference Images"]) ?? 0;

      // --- Opus plan ---
      try {
        const planEls = document.querySelectorAll(
          '[class*="plan"], [class*="tier"], [class*="badge"], [class*="subscription"], header, nav'
        );
        for (const el of planEls) {
          if (el.textContent.includes("Opus")) { result.opusPlan = true; break; }
        }
        if (result.opusPlan === null) result.opusPlan = false;
      } catch (e) { result.opusPlan = false; }

      // --- Free generation detection (NAI's own cost indicator) ---
      try {
        const genBtn = this.getGenerateButton();
        if (genBtn) {
          let container = genBtn.parentElement;
          for (let i = 0; i < 4 && container; i++) {
            const costEls = container.querySelectorAll('[class*="anlas"], [class*="cost"]');
            for (const el of costEls) {
              const t = el.textContent.trim();
              if (t === "0" || t.toLowerCase() === "free") { result.isFree = true; break; }
            }
            if (result.isFree) break;
            container = container.parentElement;
          }
        }
        if (result.isFree === null) result.isFree = false;
      } catch (e) { result.isFree = false; }

      return result;
    },
  };

  // ============================================
  // WEIGHT SYNTAX UTILITIES (V4.5 Format Priority)
  // ============================================
  const WeightSyntax = {
    // Format weight using V4.5 syntax: N::tag::
    formatV45(tag, weight) {
      if (weight === 1) return tag;
      // Support negative weights for V4.5
      return `${weight.toFixed(1)}::${tag}::`;
    },

    // Format weight using legacy bracket notation
    formatLegacy(tag, weight) {
      if (weight === 1) return tag;
      if (weight >= 1) {
        const count = Math.max(
          1,
          Math.round(Math.log(weight) / Math.log(CONFIG.WEIGHT_MULTIPLIER)),
        );
        return "{".repeat(count) + tag + "}".repeat(count);
      } else {
        const count = Math.max(
          1,
          Math.round(Math.log(weight) / Math.log(1 / CONFIG.WEIGHT_MULTIPLIER)),
        );
        return "[".repeat(count) + tag + "]".repeat(count);
      }
    },

    // Parse V4.5 format: N::tag:: (supports negative weights)
    parseV45(text) {
      const weights = [];
      const regex = /(-?\d+\.?\d*)::([^:]+)::/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        weights.push({
          full: match[0],
          weight: parseFloat(match[1]),
          tag: match[2].trim(),
          index: match.index,
          format: "v45",
        });
      }
      return weights;
    },

    // Parse legacy bracket format: {tag}, {{tag}}, [tag]
    parseLegacy(text) {
      const weights = [];
      const regex = /(\{+[^}]+\}+|\[+[^\[]+\]+)/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const full = match[0];
        const tagMatch = full.match(/[\{\[](.+)[\}\]]/);
        if (tagMatch) {
          const tag = tagMatch[1];
          const weight = this.bracketToNumerical(full);
          weights.push({
            full,
            tag,
            weight,
            index: match.index,
            format: "legacy",
          });
        }
      }
      return weights;
    },

    // Parse all weight formats (V4.5 first, then legacy)
    parseAll(text) {
      const v45Weights = this.parseV45(text);
      const legacyWeights = this.parseLegacy(text);
      return [...v45Weights, ...legacyWeights].sort(
        (a, b) => a.index - b.index,
      );
    },

    // Convert bracket notation to numerical weight
    bracketToNumerical(bracketStr) {
      const openCount = (bracketStr.match(/\{/g) || []).length;
      const closeCount = (bracketStr.match(/\}/g) || []).length;
      const totalOpen = openCount - closeCount;

      if (totalOpen > 0) {
        return Math.pow(CONFIG.WEIGHT_MULTIPLIER, totalOpen);
      } else if (totalOpen < 0) {
        return Math.pow(1 / CONFIG.WEIGHT_MULTIPLIER, Math.abs(totalOpen));
      }
      return 1;
    },

    // Apply weight to tag (V4.5 format by default)
    applyWeight(tag, weight, useV45 = true) {
      if (weight === 1) return tag;
      if (useV45) {
        return this.formatV45(tag, weight);
      }
      return this.formatLegacy(tag, weight);
    },

    // Convert legacy format to V4.5 format
    convertToV45(text) {
      const legacyWeights = this.parseLegacy(text);
      let result = text;
      // Process in reverse order to maintain correct indices
      for (let i = legacyWeights.length - 1; i >= 0; i--) {
        const w = legacyWeights[i];
        const v45Format = this.formatV45(w.tag, w.weight);
        result =
          result.substring(0, w.index) +
          v45Format +
          result.substring(w.index + w.full.length);
      }
      return result;
    },
  };

  // ============================================
  // RANDOMIZER UTILITIES
  // ============================================
  const Randomizer = {
    // Pattern: ||opt1|opt2|opt3||
    regex: /\|\|([^|]+(?:\|[^|]+)*)\|\|/g,

    // Parse randomizer syntax
    parse(text) {
      const randomizers = [];
      let match;
      const regex = new RegExp(this.regex);
      while ((match = regex.exec(text)) !== null) {
        const full = match[0];
        const options = match[1]
          .split("|")
          .map((o) => o.trim())
          .filter((o) => o.length > 0);
        randomizers.push({ full, options, index: match.index });
      }
      return randomizers;
    },

    // Generate all variations
    generateVariations(text) {
      const randomizers = this.parse(text);
      if (randomizers.length === 0) return [text];

      const first = randomizers[0];
      let variations = [];

      for (const option of first.options) {
        variations.push(
          text.substring(0, first.index) +
          option +
          text.substring(first.index + first.full.length),
        );
      }

      // For each variation, recursively process remaining randomizers
      for (let i = 1; i < randomizers.length; i++) {
        const current = randomizers[i];
        const newVariations = [];

        for (const varText of variations) {
          // Find this randomizer in the variation
          const regex = new RegExp(this.regex);
          let match;
          while ((match = regex.exec(varText)) !== null) {
            if (
              match.index === current.index ||
              varText.substring(0, match.index).split("||").length - 1 === i
            ) {
              const options = match[1]
                .split("|")
                .map((o) => o.trim())
                .filter((o) => o.length > 0);
              for (const option of options) {
                newVariations.push(
                  varText.substring(0, match.index) +
                  option +
                  varText.substring(match.index + match[0].length),
                );
              }
              break;
            }
          }
        }
        variations = newVariations.length > 0 ? newVariations : variations;
      }

      return variations.length > 0 ? variations : [text];
    },

    // Replace with specific option (for preview)
    replaceOption(text, randomizerIndex, optionIndex) {
      const randomizers = this.parse(text);
      if (randomizerIndex < 0 || randomizerIndex >= randomizers.length)
        return text;

      const r = randomizers[randomizerIndex];
      if (optionIndex < 0 || optionIndex >= r.options.length) return text;

      return (
        text.substring(0, r.index) +
        r.options[optionIndex] +
        text.substring(r.index + r.full.length)
      );
    },

    // Count total variations
    countVariations(text) {
      const randomizers = this.parse(text);
      if (randomizers.length === 0) return 1;

      return randomizers.reduce((acc, r) => acc * r.options.length, 1);
    },

    // Pick one random option per group (for direct Apply)
    pickRandom(text) {
      const randomizers = this.parse(text);
      if (randomizers.length === 0) return text;

      let result = text;
      // Process in reverse order to preserve indices
      for (let i = randomizers.length - 1; i >= 0; i--) {
        const r = randomizers[i];
        const picked = r.options[Math.floor(Math.random() * r.options.length)];
        result = result.substring(0, r.index) + picked + result.substring(r.index + r.full.length);
      }
      return result;
    },
  };

  // ============================================
  // MULTI-CHARACTER UTILITIES
  // ============================================
  const MultiCharacter = {
    separator: "|",

    // Parse multi-character syntax: base | char1 | char2
    parse(text) {
      const parts = text.split(this.separator).map((p) => p.trim());
      if (parts.length < 2) return null;

      return {
        base: parts[0],
        characters: parts.slice(1),
      };
    },

    // Build multi-character prompt
    build(base, characters) {
      return [base, ...characters].join(this.separator + " ");
    },
  };

  // ============================================
  // PROMPT BLENDING UTILITIES
  // ============================================
  const PromptBlending = {
    // Pattern: prompt1|prompt2:0.3 or prompt1:1|prompt2:-0.2
    regex: /([^:|]+):([+-]?\d+\.?\d*)(?=\||$)/g,

    parse(text) {
      const blends = [];
      let match;
      while ((match = this.regex.exec(text)) !== null) {
        blends.push({
          prompt: match[1].trim(),
          weight: parseFloat(match[2]),
          index: match.index,
        });
      }
      return blends;
    },
  };

  // ============================================
  // UI COMPONENTS
  // ============================================
  function createPanel() {
    const panel = document.createElement("div");
    panel.id = "nai-ext-panel";
    panel.innerHTML = `
            <div class="nai-ext-header">
                <div class="nai-ext-title">
                    <span class="nai-ext-title-icon">🎨</span>
                    <span>Ekphrasis</span>
                    <span style="font-size:10px;background:#16a34a;padding:2px 5px;border-radius:2px;text-transform:none;letter-spacing:0;">v4</span>
                </div>
                <div class="nai-ext-controls">
                    <button class="nai-ext-btn-icon" id="nai-ext-help" title="Help / Guide">?</button>
                    <button class="nai-ext-btn-icon" id="nai-ext-minimize" title="Minimize">−</button>
                    <button class="nai-ext-btn-icon" id="nai-ext-maximize" title="Restore">□</button>
                    <button class="nai-ext-btn-icon" id="nai-ext-close" title="Close">×</button>
                </div>
            </div>

            <!-- Batch Raw Import Modal -->
            <div id="nai-ext-batch-modal">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">📋 Batch Raw Import</span>
                    <button class="nai-ext-help-close" id="nai-ext-batch-close">× Close</button>
                </div>
                <div class="nai-ext-batch-hint">Paste raw prompts below. Separate each prompt with <code style="background:var(--ekp-bg-elevated);padding:1px 4px;border:1px solid var(--ekp-border);border-radius:3px;color:var(--ekp-accent);">---</code> on its own line. Each block = 1 item in queue.</div>
                <textarea id="nai-ext-batch-textarea" placeholder="a cute fox, masterpiece, very aesthetic&#10;---&#10;wolf in forest, best quality, absurdres&#10;---&#10;dragon, cinematic lighting, detailed"></textarea>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span class="nai-ext-batch-count" id="nai-ext-batch-count">0 prompts detected</span>
                    <div class="nai-ext-batch-actions">
                        <button class="nai-ext-btn secondary" id="nai-ext-batch-cancel" style="font-size:10px;padding:4px 10px;">Cancel</button>
                        <button class="nai-ext-btn" id="nai-ext-batch-confirm" style="font-size:10px;padding:4px 10px;" disabled>Add to Queue</button>
                    </div>
                </div>
            </div>

            <!-- Help / Guide Modal -->
            <div id="nai-ext-help-modal">
                <button class="nai-ext-help-close" id="nai-ext-help-close">× Close</button>
                <div style="clear:both; margin-bottom:10px;"></div>

                <div class="nai-ext-help-section">
                    <div class="nai-ext-help-title">⚖️ Weight Syntax</div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">3::tag::</span><span>Numerical emphasis — equivalent to {{{tag}}} (V4+)</span></div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">-1::tag::</span><span>Negative emphasis — suppresses the tag (V4.5 only)</span></div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">{tag}</span><span>Boost ×1.05 — stack braces for stronger effect</span></div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">{{tag}}</span><span>Boost ×1.05² (each extra pair multiplies again)</span></div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">[tag]</span><span>Weaken ÷1.05 — stack brackets for weaker effect</span></div>
                    <code class="nai-ext-help-code">3::blue eyes::, -1::blur::, {{smile}}, [background]</code>
                </div>

                <div class="nai-ext-help-section">
                    <div class="nai-ext-help-title">🎲 Randomizer Syntax</div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">||a|b|c||</span><span>Apply+ picks one randomly; Queue expands all variants</span></div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">||a|b|| ||c|d||</span><span>Multiple groups — each resolved independently</span></div>
                    <code class="nai-ext-help-code">||red|blue|green|| hair, ||smiling|neutral|| expression</code>
                    <p class="nai-ext-help-note">Apply+ picks one random option per group. Add to Queue → generates every combination (2 groups × 3 options = 6 entries).</p>
                </div>

                <div class="nai-ext-help-section">
                    <div class="nai-ext-help-title">🏷️ Placeholder Syntax</div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">{artist}</span><span>Substituted with the selected value from the Artist tab</span></div>
                    <div class="nai-ext-help-row"><span class="nai-ext-help-syntax">{character}</span><span>Works for any placeholder tab name you create</span></div>
                    <code class="nai-ext-help-code">{artist}, {character}, long hair, masterpiece</code>
                    <p class="nai-ext-help-note">Note: {name} here is substitution, not a weight boost — unlike the {tag} weight syntax above.</p>
                </div>
            </div>

            <div class="nai-ext-body">
                <!-- Templates Section -->
                <div class="nai-ext-section" id="nai-ext-templates-section">
                    <div class="nai-ext-section-header collapsible">
                        <span class="nai-ext-section-icon">📝</span>
                        <span>TEMPLATES</span>
                    </div>
                    <div class="nai-ext-section-content">
                        <!-- Mode tabs: Positive / Negative -->
                        <div class="nai-ext-tabs" id="nai-ext-template-mode-tabs" style="margin-bottom:6px;">
                            <button class="nai-ext-tab active" data-template-mode="positive">Positive</button>
                            <button class="nai-ext-tab" data-template-mode="negative">Negative</button>
                        </div>

                        <!-- Positive templates view -->
                        <div id="nai-ext-positive-view">
                            <div class="nai-ext-tabs" id="nai-ext-category-tabs">
                                <button class="nai-ext-tab active" data-category="all">All</button>
                            </div>
                            <div class="nai-ext-template-list" id="nai-ext-template-list">
                                <div class="nai-ext-empty">No templates saved</div>
                            </div>
                            <button class="nai-ext-btn nai-ext-btn-full secondary" id="nai-ext-add-template">
                                + Add Current Prompt as Template
                            </button>
                        </div>

                        <!-- Negative templates view -->
                        <div id="nai-ext-negative-view" style="display:none;">
                            <div class="nai-ext-template-list" id="nai-ext-neg-template-list">
                                <div class="nai-ext-empty">No negative templates saved</div>
                            </div>
                            <button class="nai-ext-btn nai-ext-btn-full secondary" id="nai-ext-add-neg-template">
                                + Add Negative Template
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Placeholders Section -->
                <div class="nai-ext-section" id="nai-ext-placeholders-section">
                    <div class="nai-ext-section-header collapsible">
                        <span class="nai-ext-section-icon">🏷️</span>
                        <span>PLACEHOLDERS</span>
                    </div>
                    <div class="nai-ext-section-content">
                        <!-- Tab selector -->
                        <div class="nai-ext-tabs" id="nai-ext-placeholder-tabs">
                            <button class="nai-ext-tab active" data-placeholder="artist">artist</button>
                            <button class="nai-ext-tab" data-placeholder="character">character</button>
                            <button class="nai-ext-tab" data-placeholder="style">style</button>
                            <button class="nai-ext-tab nai-ext-tab-add" id="nai-ext-add-placeholder-type">+</button>
                        </div>

                        <!-- Search + Stats -->
                        <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center;">
                            <input type="text" class="nai-ext-input" id="nai-ext-placeholder-search" placeholder="Search..." style="flex:1;font-size:11px;padding:5px 8px;">
                            <div style="font-size:10px;color:#666;font-weight:600;min-width:60px;text-align:right;"><span id="nai-ext-placeholder-stats">0/0</span></div>
                        </div>

                        <!-- Values list -->
                        <div class="nai-ext-placeholder-values" id="nai-ext-placeholder-values">
                            <div class="nai-ext-empty">No values added</div>
                        </div>

                        <!-- Selection controls -->
                        <div class="nai-ext-btn-row" style="margin-bottom: 8px;">
                            <button class="nai-ext-btn secondary" id="nai-ext-select-all" style="flex:1; font-size: 10px;">✓ All</button>
                            <button class="nai-ext-btn secondary" id="nai-ext-deselect-all" style="flex:1; font-size: 10px;">✗ None</button>
                            <button class="nai-ext-btn danger" id="nai-ext-delete-selected" style="flex:1; font-size: 10px; display:none;">🗑 Del</button>
                        </div>

                        <!-- Input mode selector -->
                        <div style="display:flex;gap:5px;margin-bottom:8px;">
                            <button class="nai-ext-btn nai-ext-btn-full" id="nai-ext-single-mode-btn" style="flex:1;padding:6px;font-size:11px;opacity:0.7;">Single</button>
                            <button class="nai-ext-btn nai-ext-btn-full secondary" id="nai-ext-batch-mode-btn" style="flex:1;padding:6px;font-size:11px;">Batch</button>
                        </div>

                        <!-- Single value input -->
                        <div id="nai-ext-single-input-area" style="display:flex;gap:5px;margin-bottom:8px;">
                            <input type="text" class="nai-ext-input" id="nai-ext-value-input" placeholder="Enter value..." style="flex:1;">
                            <button class="nai-ext-btn" id="nai-ext-add-value">Add</button>
                        </div>

                        <!-- Batch input -->
                        <div id="nai-ext-batch-input-area" style="display: none; margin-bottom:8px;">
                            <textarea class="nai-ext-textarea" id="nai-ext-batch-input" placeholder="Paste values (one per line or comma-separated)&#10;Example: red, blue, green&#10;or&#10;red&#10;blue&#10;green"></textarea>
                            <button class="nai-ext-btn nai-ext-btn-full secondary" id="nai-ext-batch-add" style="margin-top: 6px;">+ Add All</button>
                        </div>

                        <!-- Options -->
                        <label class="nai-ext-checkbox-row">
                            <input type="checkbox" id="nai-ext-prefix-toggle">
                            <span title="e.g., artist:value">Add prefix (type:value)</span>
                        </label>
                    </div>
                </div>

            </div>

            <!-- Fixed Footer: Apply + Queue + Settings -->
            <div class="nai-ext-footer" id="nai-ext-footer">

                <!-- Hidden compat shim — updateQueueStatus() reads this -->
                <div id="nai-ext-queue-status" style="display:none;">
                    <div class="nai-ext-status-dot"></div>
                    <span>Queue idle</span>
                </div>

                <!-- Strip 1: Quick Apply -->
                <div class="nai-ext-footer-strip" id="nai-ext-apply-strip">
                    <div class="nai-ext-footer-panel" id="nai-ext-apply-panel">
                    <div id="nai-ext-preview" title="Resolved positive prompt preview">Select a template to preview</div>
                    <div id="nai-ext-preview-negative" title="Linked negative prompt preview" style="display:none;"></div>
                    </div>
                    <div class="nai-ext-footer-bar" id="nai-ext-apply-bar">
                        <span style="font-size:11px;flex-shrink:0;">⚡</span>
                    <span class="nai-ext-footer-preview-text" id="nai-ext-footer-preview-text" title="Inline preview of the resolved prompt">No template selected</span>
                    <button class="nai-ext-footer-apply-btn" id="nai-ext-apply-prompt" disabled title="Apply the resolved positive prompt to NovelAI">Apply+</button>
                    <button class="nai-ext-footer-apply-btn secondary" id="nai-ext-apply-both" disabled title="Apply the positive prompt and its linked negative prompt">Pos+Neg</button>
                        <button class="nai-ext-footer-toggle" id="nai-ext-apply-toggle" title="Expand preview"></button>
                    </div>
                </div>

                <!-- Strip 2: Batch Queue -->
                <div class="nai-ext-footer-strip" id="nai-ext-queue-strip">
                    <div class="nai-ext-footer-panel" id="nai-ext-queue-panel">
                        <div class="nai-ext-progress" id="nai-ext-progress" style="display:none;margin-bottom:6px;">
                            <div class="nai-ext-progress-text">
                                <span id="nai-ext-progress-label">0/0</span>
                                <span id="nai-ext-progress-percent">0%</span>
                            </div>
                            <div class="nai-ext-progress-bar">
                                <div class="nai-ext-progress-fill" id="nai-ext-progress-fill" style="width:0%"></div>
                            </div>
                        </div>
                          <div class="nai-ext-queue-list" id="nai-ext-queue-list" title="Queued prompts. Hover each row to inspect the full prompt." style="max-height:130px;">
                            <div class="nai-ext-empty">Queue is empty</div>
                        </div>
                          <button class="nai-ext-btn nai-ext-btn-full secondary" id="nai-ext-add-to-queue" disabled title="Add every selected prompt combination to the queue" style="margin-top:5px;font-size:10px;padding:5px;">+ Add Selected to Queue</button>
                    </div>
                    <div class="nai-ext-footer-bar" id="nai-ext-queue-bar">
                        <div class="nai-ext-status-dot" id="nai-ext-queue-dot"></div>
                          <span class="nai-ext-footer-queue-counter" id="nai-ext-queue-counter" title="Queue progress">0/0</span>
                          <span class="nai-ext-footer-queue-meta" id="nai-ext-queue-timing" title="Batch ETA and elapsed time">ETA --</span>
                          <button class="nai-ext-footer-queue-btn" id="nai-ext-start-queue" disabled title="Start queue processing">▶</button>
                          <button class="nai-ext-footer-queue-btn" id="nai-ext-resume-queue" disabled style="display:none;" title="Resume queue processing">▶</button>
                          <button class="nai-ext-footer-queue-btn" id="nai-ext-pause-queue" disabled title="Pause the running queue">⏸</button>
                          <button class="nai-ext-footer-queue-btn" id="nai-ext-stop-queue" disabled title="Stop the running queue">⏹</button>
                          <button class="nai-ext-footer-queue-btn" id="nai-ext-clear-queue" disabled title="Clear every queued item">🗑</button>
                        <button class="nai-ext-footer-queue-btn" id="nai-ext-retry-failed" disabled style="display:none;" title="Retry failed items">↺</button>
                        <button class="nai-ext-footer-queue-btn" id="nai-ext-batch-import" title="Batch raw import">📋</button>
                        <button class="nai-ext-footer-toggle" id="nai-ext-queue-toggle" title="Expand queue"></button>
                    </div>
                </div>

                <!-- Strip 3: Settings (inline, no expand panel) -->
                <div class="nai-ext-footer-strip" id="nai-ext-settings-strip">
                    <div class="nai-ext-footer-bar" id="nai-ext-settings-bar">
                        <span style="font-size:11px;flex-shrink:0;">⚙️</span>
                        <span class="nai-ext-footer-label">Delay</span>
                      <input type="number" class="nai-ext-footer-number-input" id="nai-ext-delay" value="2000" min="500" max="30000" step="500" title="Delay between queue generations in milliseconds">
                        <span class="nai-ext-footer-label">ms</span>
                      <button class="nai-ext-footer-icon-btn" id="nai-ext-free-safe-toggle" title="FREE OFF: leave the current steps value unchanged">FREE OFF</button>
                      <button class="nai-ext-footer-icon-btn" id="nai-ext-randomizer-toggle" title="RAND OFF: keep randomizer blocks unresolved until enabled">RAND OFF</button>
                        <button class="nai-ext-footer-icon-btn" id="nai-ext-export" title="Export config">📥</button>
                        <button class="nai-ext-footer-icon-btn" id="nai-ext-import" title="Import config">📤</button>
                        <input type="file" id="nai-ext-import-file" accept=".json" style="display:none;">
                    </div>
                </div>

                <!-- Strip 4: Token Counter + Quality Tags -->
                <div class="nai-ext-footer-strip" id="nai-ext-quality-strip">
                    <div class="nai-ext-footer-panel" id="nai-ext-quality-panel">
                        <div style="font-size:10px;color:#666;font-weight:600;margin-bottom:5px;">Model Quality Tags</div>
                        <div id="nai-ext-model-tabs" style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:6px;">
                            <button class="nai-ext-model-btn" data-model="v45_full">V4.5 Full</button>
                            <button class="nai-ext-model-btn" data-model="v45_curated">V4.5 Cur</button>
                            <button class="nai-ext-model-btn" data-model="v4_full">V4 Full</button>
                            <button class="nai-ext-model-btn" data-model="v4_curated">V4 Cur</button>
                            <button class="nai-ext-model-btn" data-model="v3">V3</button>
                        </div>
                        <div id="nai-ext-quality-tags-preview" style="font-size:10px;font-family:var(--ekp-font-mono);color:var(--ekp-fg-muted);background:var(--ekp-bg-input);padding:5px;border:1px solid var(--ekp-border);border-radius:3px;word-break:break-all;margin-bottom:5px;"></div>
                        <button class="nai-ext-btn nai-ext-btn-full" id="nai-ext-insert-quality-tags" title="Append quality tags to current NAI prompt">+ Insert Quality Tags</button>
                    </div>
                    <div class="nai-ext-footer-bar" id="nai-ext-quality-bar">
                        <span style="font-size:11px;flex-shrink:0;">🏷️</span>
                        <span id="nai-ext-quality-model-label" style="font-size:10px;color:var(--ekp-fg-muted);flex:1;">V4.5 Full</span>
                        <span id="nai-ext-token-count" class="ok" title="Approximate T5 token count of current NAI prompt (~512 limit for V4+)">~0/512</span>
                        <button class="nai-ext-footer-toggle" id="nai-ext-quality-toggle" title="Quality tags &amp; token counter"></button>
                    </div>
                </div>

                <!-- Strip 5: Anlas Calculator -->
                <div class="nai-ext-footer-strip" id="nai-ext-anlas-strip">
                    <div class="nai-ext-footer-panel" id="nai-ext-anlas-panel">
                        <div style="font-size:10px;color:#666;font-weight:600;margin-bottom:6px;">Anlas Cost Calculator</div>

                        <!-- Opus plan toggle -->
                        <div class="nai-ext-anlas-row" style="margin-bottom:7px;">
                            <label title="Opus plan: V4.5 Full costs 0 Anlas base">Opus Plan</label>
                            <button class="nai-ext-opus-toggle" id="nai-ext-opus-toggle" title="Toggle Opus plan (V4.5 Full = 0 Anlas base)">OFF</button>
                        </div>

                        <!-- Precise Reference counter -->
                        <div class="nai-ext-anlas-row">
                            <label title="Each Precise Reference costs +5 Anlas per image">Precise Ref <span style="color:#999;">(+5 ea)</span></label>
                            <div class="nai-ext-anlas-spinner">
                                <button id="nai-ext-ref-dec" title="Remove one Precise Reference">−</button>
                                <span id="nai-ext-ref-count">0</span>
                                <button id="nai-ext-ref-inc" title="Add one Precise Reference">+</button>
                            </div>
                        </div>

                        <!-- Vibe Transfer counter -->
                        <div class="nai-ext-anlas-row">
                            <label title="5th+ Vibe Transfer costs +2 Anlas each">Vibe Transfer <span style="color:#999;">(5th+ +2 ea)</span></label>
                            <div class="nai-ext-anlas-spinner">
                                <button id="nai-ext-vibe-dec" title="Remove one Vibe Transfer">−</button>
                                <span id="nai-ext-vibe-count">0</span>
                                <button id="nai-ext-vibe-inc" title="Add one Vibe Transfer">+</button>
                            </div>
                        </div>

                        <!-- Cost breakdown -->
                        <div id="nai-ext-anlas-breakdown" style="font-size:10px;color:var(--ekp-fg-muted);margin-top:6px;padding-top:5px;border-top:1px solid var(--ekp-border);font-family:var(--ekp-font-mono);line-height:1.7;"></div>
                    </div>
                    <div class="nai-ext-footer-bar" id="nai-ext-anlas-bar">
                        <span style="font-size:11px;flex-shrink:0;">💎</span>
                        <span style="font-size:10px;color:var(--ekp-fg-muted);flex:1;" id="nai-ext-anlas-bar-label">Anlas / image</span>
                        <span id="nai-ext-anlas-cost" class="free" title="Estimated Anlas cost per generation">0 Anlas</span>
                        <button class="nai-ext-footer-toggle" id="nai-ext-anlas-toggle" title="Anlas cost calculator"></button>
                    </div>
                </div>

            </div>
        `;

    document.body.appendChild(panel);
    return panel;
  }

  // ============================================
  // UI RENDERING
  // ============================================

  function renderCategoryTabs() {
    const container = document.getElementById("nai-ext-category-tabs");
    if (!container) return;

    const categories = ["all", ...state.categories];
    container.innerHTML =
      categories
        .map((cat) => {
          const isActive = state.currentCategoryFilter === cat;
          const actions =
            isActive && cat !== "all"
              ? `<span class="nai-ext-tab-action" data-cat-edit="${escapeHtml(cat)}" title="Rename">✎</span><span class="nai-ext-tab-action" data-cat-del="${escapeHtml(cat)}" title="Delete">×</span>`
              : "";
          return `<button class="nai-ext-tab ${isActive ? "active" : ""}" data-category="${cat}">${cat}${actions}</button>`;
        })
        .join("") +
      '<button class="nai-ext-tab nai-ext-tab-add" id="nai-ext-add-category" title="Add category">+</button>';

    container.querySelectorAll(".nai-ext-tab[data-category]").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        if (e.target.dataset.catEdit || e.target.dataset.catDel) return;
        state.currentCategoryFilter = tab.dataset.category;
        renderCategoryTabs();
        renderTemplates();
      });
    });

    container.querySelectorAll("[data-cat-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const oldName = btn.dataset.catEdit;
        const newName = prompt("Rename category:", oldName);
        if (!newName || !newName.trim() || newName.trim() === oldName) return;
        const trimmed = newName.trim().toLowerCase();
        if (state.categories.includes(trimmed)) {
          alert("Category already exists.");
          return;
        }
        const oldMeta = ensureCategoryMeta(oldName);
        const idx = state.categories.indexOf(oldName);
        if (idx >= 0) state.categories[idx] = trimmed;
        state.categoryMeta[trimmed] = { ...oldMeta, label: trimmed };
        delete state.categoryMeta[oldName];
        state.templates.forEach((t) => {
          if (typeof t === "object" && t.category === oldName) {
            t.category = trimmed;
            t.categoryId = state.categoryMeta[trimmed].id;
            t.updatedAt = nowIso();
          }
        });
        if (state.currentCategoryFilter === oldName)
          state.currentCategoryFilter = trimmed;
        saveCategories();
        renderCategoryTabs();
        renderTemplates();
      });
    });

    container.querySelectorAll("[data-cat-del]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cat = btn.dataset.catDel;
        const count = state.templates.filter(
          (t) => typeof t === "object" && t.category === cat,
        ).length;
        if (
          !confirm(
            `Delete category "${cat}"?${count > 0 ? ` ${count} template(s) will move to "general".` : ""}`,
          )
        )
          return;
        const generalCategory = ensureCategoryMeta("general");
        state.templates.forEach((t) => {
          if (typeof t === "object" && t.category === cat) {
            t.category = "general";
            t.categoryId = generalCategory.id;
            t.updatedAt = nowIso();
          }
        });
        state.categories = state.categories.filter((c) => c !== cat);
        delete state.categoryMeta[cat];
        if (state.currentCategoryFilter === cat)
          state.currentCategoryFilter = "all";
        saveCategories();
        renderCategoryTabs();
        renderTemplates();
      });
    });

    document
      .getElementById("nai-ext-add-category")
      ?.addEventListener("click", () => {
        const name = prompt("New category name:");
        if (!name || !name.trim()) return;
        const trimmed = name.trim().toLowerCase();
        if (state.categories.includes(trimmed)) {
          alert("Already exists.");
          return;
        }
        ensureCategoryMeta(trimmed);
        state.currentCategoryFilter = trimmed;
        saveCategories();
        renderCategoryTabs();
        renderTemplates();
      });
  }

  function renderTemplates() {
    const list = document.getElementById("nai-ext-template-list");
    if (!list) return;

    let filtered = state.templates;
    if (state.currentCategoryFilter !== "all") {
      filtered = state.templates.filter((t) => {
        const cat = typeof t === "object" ? t.category : "general";
        return cat === state.currentCategoryFilter;
      });
    }

    if (filtered.length === 0) {
      list.innerHTML = '<div class="nai-ext-empty">No templates saved</div>';
      return;
    }

    list.innerHTML = filtered
      .map((template, filteredIndex) => {
        const actualIndex = state.templates.indexOf(template);
        const content =
          typeof template === "object" ? template.content : template;
        const name = typeof template === "object" ? template.name : "";
        const category = typeof template === "object" ? template.category : "";
        const linkedNegativeId = getTemplateLinkedNegativeId(template);
        const hasValidNeg = !!(linkedNegativeId && findNegativeTemplateById(linkedNegativeId));
        const catBadge = category
          ? `<span class="nai-ext-template-category">${category}</span>`
          : "";
        const negBadge = hasValidNeg
          ? `<span title="Linked to negative template" style="font-size:9px;background:#dc2626;color:#fff;padding:1px 4px;margin-right:2px;font-weight:700;">N</span>`
          : "";
        const isSelected = state.selectedTemplates.includes(actualIndex);

        const displayText = name ? name : content;
        const subtitle = name
          ? `<div style="font-size:10px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(content.substring(0, 50))}${content.length > 50 ? "..." : ""}</div>`
          : "";

        return `
                <div class="nai-ext-template-item ${isSelected ? "active" : ""}"
                     data-index="${actualIndex}">
                    <div style="flex:1;overflow:hidden;">
                        <span class="nai-ext-template-text" title="${escapeHtml(content)}" style="${name ? "font-weight:600;" : ""}">${escapeHtml(displayText)}</span>
                        ${subtitle}
                    </div>
                    ${negBadge}${catBadge}
                    <div class="nai-ext-template-actions">
                        <button class="nai-ext-template-btn edit" data-index="${actualIndex}" title="Edit">✎</button>
                        <button class="nai-ext-template-btn delete" data-index="${actualIndex}" title="Delete">×</button>
                    </div>
                </div>
            `;
      })
      .join("");

    list.querySelectorAll(".nai-ext-template-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("nai-ext-template-btn")) return;
        const index = parseInt(item.dataset.index);
        const idx = state.selectedTemplates.indexOf(index);
        if (idx === -1) {
          state.selectedTemplates.push(index);
        } else {
          state.selectedTemplates.splice(idx, 1);
        }
        renderTemplates();
        updatePreview();
        updateButtonStates();
        updateWeightEditor();
        updateRandomizerPreview();
      });
    });

    list.querySelectorAll(".nai-ext-template-btn.delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        if (confirm("Delete this template?")) {
          state.templates.splice(index, 1);
          state.selectedTemplates = state.selectedTemplates
            .filter((i) => i !== index)
            .map((i) => (i > index ? i - 1 : i));
          saveTemplates();
          renderTemplates();
          updatePreview();
          updateButtonStates();
        }
      });
    });

    list.querySelectorAll(".nai-ext-template-btn.edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        openEditTemplateModal(index);
      });
    });
  }

  function openEditTemplateModal(index) {
    const template = state.templates[index];
    const content = typeof template === "object" ? template.content : template;
    const currentName = typeof template === "object" ? template.name || "" : "";
    const currentNegId = getTemplateLinkedNegativeId(template);

    // Build negative template options
    const negOptions = state.negativeTemplates.map((nt) => {
      const label = typeof nt === "object" ? (nt.name || nt.content.substring(0, 30)) : nt.substring(0, 30);
      const selected = currentNegId === nt.id ? " selected" : "";
      return `<option value="${nt.id}"${selected}>${escapeHtml(label)}${label.length >= 30 ? "…" : ""}</option>`;
    }).join("");

    const modalId = "nai-ext-edit-template-modal";
    let modal = document.getElementById(modalId);
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = modalId;
    modal.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);
      z-index:99999;display:flex;align-items:center;justify-content:center;
    `;
    modal.innerHTML = `
      <div style="background:var(--ekp-bg-elevated);border:1px solid var(--ekp-border-strong);border-radius:5px;padding:16px;width:340px;max-width:95vw;font-family:var(--ekp-font-mono);font-size:13px;color:var(--ekp-fg-primary);">
        <div style="font-weight:500;margin-bottom:12px;font-size:14px;color:var(--ekp-fg-primary);">Edit Template</div>
        <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--ekp-fg-muted);">Name (optional)</label>
        <input id="nai-ext-edit-tpl-name" type="text" value="${escapeHtml(currentName)}" placeholder="Leave empty to show prompt text"
          style="width:100%;box-sizing:border-box;border:1px solid var(--ekp-border);border-radius:3px;background:var(--ekp-bg-input);color:var(--ekp-fg-primary);padding:6px 8px;font-size:12px;margin-bottom:10px;font-family:var(--ekp-font-mono);">
        <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--ekp-fg-muted);">Prompt</label>
        <textarea id="nai-ext-edit-tpl-content" rows="4"
          style="width:100%;box-sizing:border-box;border:1px solid var(--ekp-border);border-radius:3px;background:var(--ekp-bg-input);color:var(--ekp-fg-primary);padding:6px 8px;font-size:12px;resize:vertical;margin-bottom:10px;font-family:var(--ekp-font-mono);">${escapeHtml(content)}</textarea>
        <label style="display:block;margin-bottom:4px;font-size:11px;color:var(--ekp-fg-muted);">Linked Negative Template</label>
        <select id="nai-ext-edit-tpl-neg"
          style="width:100%;box-sizing:border-box;border:1px solid var(--ekp-border);border-radius:3px;background:var(--ekp-bg-input);color:var(--ekp-fg-primary);padding:6px 8px;font-size:12px;margin-bottom:14px;font-family:var(--ekp-font-mono);">
          <option value=""${currentNegId === undefined ? " selected" : ""}>(none)</option>
          ${negOptions}
        </select>
        ${state.negativeTemplates.length === 0 ? '<div style="font-size:10px;color:var(--ekp-fg-subtle);margin-top:-10px;margin-bottom:10px;">No negative templates yet — create some in the Negative tab first.</div>' : ''}
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="nai-ext-edit-tpl-cancel" style="padding:6px 14px;border:1px solid var(--ekp-border);border-radius:3px;background:var(--ekp-bg-elevated);color:var(--ekp-fg-primary);cursor:pointer;font-size:12px;font-family:var(--ekp-font-mono);">Cancel</button>
          <button id="nai-ext-edit-tpl-save" style="padding:6px 14px;border:none;border-radius:3px;background:var(--ekp-accent);color:var(--ekp-accent-fg);cursor:pointer;font-size:12px;font-family:var(--ekp-font-mono);">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("nai-ext-edit-tpl-cancel").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    document.getElementById("nai-ext-edit-tpl-save").addEventListener("click", () => {
      const newName = document.getElementById("nai-ext-edit-tpl-name").value.trim();
      const newText = document.getElementById("nai-ext-edit-tpl-content").value.trim();
      const negSel = document.getElementById("nai-ext-edit-tpl-neg").value;
      if (!newText) return;

      const linkedNegativeId = negSel || null;

      if (typeof template === "object") {
        state.templates[index].content = newText;
        state.templates[index].name = newName;
        state.templates[index].updatedAt = nowIso();
        setTemplateLinkedNegativeId(state.templates[index], linkedNegativeId);
      } else {
        const categoryMeta = ensureCategoryMeta("general");
        state.templates[index] = normalizeTemplateRecord(
          {
            content: newText,
            name: newName,
            category: "general",
            categoryId: categoryMeta.id,
            linkedNegativeId,
          },
          "positive",
        );
      }
      saveTemplates();
      renderTemplates();
      updatePreview();
      modal.remove();
    });
    document.getElementById("nai-ext-edit-tpl-name").focus();
  }

  function renderNegativeTemplates() {
    const list = document.getElementById("nai-ext-neg-template-list");
    if (!list) return;

    if (state.negativeTemplates.length === 0) {
      list.innerHTML = '<div class="nai-ext-empty">No negative templates saved</div>';
      return;
    }

    list.innerHTML = state.negativeTemplates.map((nt, i) => {
      const text = typeof nt === "object" ? nt.content : nt;
      const name = typeof nt === "object" ? nt.name || "" : "";
      const display = name || text;
      const sub = name ? `<div style="font-size:10px;color:var(--ekp-fg-subtle);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(text.substring(0, 50))}${text.length > 50 ? "…" : ""}</div>` : "";
      // Count how many positive templates link to this negative
      const linkCount = state.templates.filter(
        (t) => typeof t === "object" && getTemplateLinkedNegativeId(t) === nt.id,
      ).length;
      const badge = linkCount > 0 ? `<span title="${linkCount} template(s) linked" style="font-size:10px;background:var(--ekp-bg-active);color:var(--ekp-fg-muted);padding:1px 5px;border-radius:9999px;margin-right:4px;">×${linkCount}</span>` : "";
      return `
        <div class="nai-ext-neg-template-item" data-neg-index="${i}">
          <div style="flex:1;overflow:hidden;">
            <div class="nai-ext-neg-template-text" title="${escapeHtml(text)}">${escapeHtml(display)}</div>
            ${sub}
          </div>
          ${badge}
          <div class="nai-ext-template-actions">
            <button class="nai-ext-template-btn edit" data-neg-index="${i}" title="Edit">✎</button>
            <button class="nai-ext-template-btn delete" data-neg-index="${i}" title="Delete">×</button>
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll(".nai-ext-template-btn.edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.negIndex);
        const nt = state.negativeTemplates[i];
        const currentText = typeof nt === "object" ? nt.content : nt;
        const currentName = typeof nt === "object" ? nt.name || "" : "";

        const newName = prompt("Name (optional):", currentName);
        if (newName === null) return;
        const newText = prompt("Edit negative prompt:", currentText);
        if (newText !== null && newText.trim()) {
          state.negativeTemplates[i] = {
            ...normalizeTemplateRecord(state.negativeTemplates[i], "negative"),
            content: newText.trim(),
            name: newName.trim(),
            updatedAt: nowIso(),
          };
          saveNegativeTemplates();
          renderNegativeTemplates();
        }
      });
    });

    list.querySelectorAll(".nai-ext-template-btn.delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.negIndex);
        const linkedTemplateId = state.negativeTemplates[i]?.id;
        if (!confirm("Delete this negative template?\n\nAll linked positive templates will lose their negative link.")) return;

        state.templates.forEach((t, ti) => {
          if (typeof t !== "object") return;
          if (getTemplateLinkedNegativeId(t) === linkedTemplateId) {
            setTemplateLinkedNegativeId(state.templates[ti], null);
          }
        });

        state.negativeTemplates.splice(i, 1);
        saveNegativeTemplates();
        renderNegativeTemplates();
        renderTemplates();
        updatePreview();
      });
    });

    // Click item to apply negative prompt to NAI
    list.querySelectorAll(".nai-ext-neg-template-item").forEach((item) => {
      item.style.cursor = "pointer";
      item.addEventListener("click", (e) => {
        if (e.target.closest(".nai-ext-template-btn")) return;
        const i = parseInt(item.dataset.negIndex);
        const nt = state.negativeTemplates[i];
        const negText = typeof nt === "object" ? nt.content : nt;
        if (negText) NovelAI.setNegativePrompt(negText);
      });
    });
  }

  function saveNegativeTemplates() {
    saveLibrary();
  }

  function renderPlaceholderTabs() {
    const container = document.getElementById("nai-ext-placeholder-tabs");
    if (!container) return;

    const types = Object.keys(state.placeholders);
    container.innerHTML =
      types
        .map((type) => {
          const count = state.selectedPlaceholders[type]?.length || 0;
          const badge =
            count > 0
              ? `<sup style="font-size:9px;color:#16a34a;">(${count})</sup>`
              : "";
          const isActive = state.currentPlaceholderTab === type;
          const actions = isActive
            ? `<span class="nai-ext-tab-action" data-ph-edit="${escapeHtml(type)}" title="Rename">✎</span><span class="nai-ext-tab-action" data-ph-del="${escapeHtml(type)}" title="Delete">×</span>`
            : "";
          return `<button class="nai-ext-tab ${isActive ? "active" : ""}" data-placeholder="${type}">${type}${badge}${actions}</button>`;
        })
        .join("") +
      '<button class="nai-ext-tab nai-ext-tab-add" id="nai-ext-add-placeholder-type">+</button>';

    container
      .querySelectorAll(".nai-ext-tab:not(.nai-ext-tab-add)")
      .forEach((tab) => {
        tab.addEventListener("click", (e) => {
          if (e.target.dataset.phEdit || e.target.dataset.phDel) return;
          state.currentPlaceholderTab = tab.dataset.placeholder;
          if (!state.placeholderRenderLimit[state.currentPlaceholderTab]) {
            state.placeholderRenderLimit[state.currentPlaceholderTab] =
              CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE;
          }
          renderPlaceholderTabs();
          renderPlaceholders();
        });
      });

    container.querySelectorAll("[data-ph-edit]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const oldName = btn.dataset.phEdit;
        const newName = prompt("Rename placeholder type:", oldName);
        if (!newName || !newName.trim() || newName.trim() === oldName) return;
        const trimmed = newName.trim().toLowerCase();
        if (state.placeholders[trimmed] !== undefined) {
          alert("Already exists.");
          return;
        }
        const values = state.placeholders[oldName];
        const selected = state.selectedPlaceholders[oldName];
        const placeholderRegex = new RegExp(`\\{${escapeRegex(oldName)}\\}`, "gi");
        delete state.placeholders[oldName];
        delete state.selectedPlaceholders[oldName];
        state.placeholders[trimmed] = values;
        state.selectedPlaceholders[trimmed] = selected || [];
        if (values) {
          values.shortName = trimmed;
          values.label = humanizeToken(trimmed);
          values.updatedAt = nowIso();
        }
        state.templates.forEach((template) => {
          if (typeof template !== "object" || !template.content) return;
          const nextContent = template.content.replace(placeholderRegex, `{${trimmed}}`);
          if (nextContent === template.content) return;
          template.content = nextContent;
          template.updatedAt = nowIso();
        });
        if (state.currentPlaceholderTab === oldName)
          state.currentPlaceholderTab = trimmed;
        savePlaceholders();
        renderPlaceholderTabs();
        renderPlaceholders();
      });
    });

    container.querySelectorAll("[data-ph-del]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = btn.dataset.phDel;
        const count = state.placeholders[type]?.length || 0;
        if (
          !confirm(
            `Delete placeholder type "${type}"?${count > 0 ? ` (${count} value(s) will be lost)` : ""}`,
          )
        )
          return;
        delete state.placeholders[type];
        delete state.selectedPlaceholders[type];
        const remaining = Object.keys(state.placeholders);
        state.currentPlaceholderTab = remaining[0] || "";
        savePlaceholders();
        renderPlaceholderTabs();
        renderPlaceholders();
      });
    });

    document
      .getElementById("nai-ext-add-placeholder-type")
      ?.addEventListener("click", () => {
        const name = prompt(
          "Enter new placeholder type name (e.g., pose, quality):",
        );
        if (
          name &&
          name.trim() &&
          !state.placeholders[name.trim().toLowerCase()]
        ) {
          const key = name.trim().toLowerCase();
          state.placeholders[key] = [];
          ensurePlaceholderBucket(key);
          state.placeholderRenderLimit[key] =
            CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE;
          state.currentPlaceholderTab = key;
          savePlaceholders();
          renderPlaceholderTabs();
          renderPlaceholders();
        }
      });
  }

  function renderPlaceholders() {
    const container = document.getElementById("nai-ext-placeholder-values");
    if (!container) return;

    const currentType = state.currentPlaceholderTab;
    const values = state.placeholders[currentType] || [];
    const selected = state.selectedPlaceholders[currentType] || [];
    const searchQuery = (state.placeholderSearchQuery || "").toLowerCase();

    // Filter by search query
    const filtered = searchQuery
      ? values.filter((v) => v.toLowerCase().includes(searchQuery))
      : values;

    // Update stats
    const statsEl = document.getElementById("nai-ext-placeholder-stats");
    if (statsEl) {
      statsEl.textContent = `${selected.length}/${filtered.length}`;
    }

    if (filtered.length === 0) {
      container.innerHTML =
        searchQuery && values.length > 0
          ? '<div class="nai-ext-empty">No matches found</div>'
          : '<div class="nai-ext-empty">No values added</div>';
      return;
    }

    const currentLimit =
      state.placeholderRenderLimit[currentType] ||
      CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE;
    const visibleCount = Math.min(filtered.length, currentLimit);

    let html = filtered
      .slice(0, visibleCount)
      .map((value, filteredIndex) => {
        const actualIndex = values.indexOf(value);
        return `
            <div class="nai-ext-artist-tag ${selected.includes(actualIndex) ? "selected" : ""}"
                 data-index="${actualIndex}">
                <span>${escapeHtml(value)}</span>
                <span class="nai-ext-artist-remove" data-index="${actualIndex}">×</span>
            </div>
        `;
      })
      .join("");

    if (filtered.length > visibleCount) {
      html += `
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 0;">
          <span style="font-size:10px;color:#666;">Showing ${visibleCount}/${filtered.length}</span>
          <button class="nai-ext-btn secondary" id="nai-ext-load-more-placeholders" style="padding:4px 8px;font-size:10px;">Load +${CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE}</button>
        </div>
      `;
    } else if (filtered.length > CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE) {
      html += `
        <div style="width:100%;font-size:10px;color:#666;padding:2px 0;">Showing all ${filtered.length} values</div>
      `;
    }

    container.innerHTML = html;
  }



  function updateWeightEditor() {
    const editor = document.getElementById("nai-ext-weight-editor");
    const empty = document.getElementById("nai-ext-weight-empty");
    const rows = document.getElementById("nai-ext-weight-rows");

    if (!editor || !empty || !rows) return;

    if (state.selectedTemplates.length === 0) {
      editor.style.display = "none";
      empty.style.display = "block";
      return;
    }

    const template = state.templates[state.selectedTemplates[0]];
    const content = typeof template === "object" ? template.content : template;

    // Parse all weights (V4.5 and legacy)
    const weights = WeightSyntax.parseAll(content);

    if (weights.length === 0) {
      editor.style.display = "none";
      empty.style.display = "block";
      return;
    }

    editor.style.display = "block";
    empty.style.display = "none";

    rows.innerHTML = weights
      .map(
        (w, i) => `
            <div class="nai-ext-weight-row">
                <span class="nai-ext-weight-tag" title="${escapeHtml(w.full)}">${escapeHtml(w.tag)}</span>
                <span style="font-size:9px;color:#888;margin-left:4px;">${w.format === "v45" ? "V4.5" : "Legacy"}</span>
                <input type="range" class="nai-ext-weight-slider"
                       min="-1" max="2" step="0.1" value="${w.weight}"
                       data-index="${i}" data-tag="${escapeHtml(w.tag)}" data-format="${w.format}" data-original="${escapeHtml(w.full)}">
                <input type="number" class="nai-ext-weight-value"
                       value="${w.weight.toFixed(1)}" step="0.1" min="-1" max="2"
                       data-index="${i}" data-tag="${escapeHtml(w.tag)}" data-format="${w.format}" data-original="${escapeHtml(w.full)}">
            </div>
        `,
      )
      .join("");

    // Add event listeners
    rows.querySelectorAll(".nai-ext-weight-slider").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const weight = parseFloat(e.target.value);
        const tag = e.target.dataset.tag;
        const idx = parseInt(e.target.dataset.index);
        const valueInput = rows.querySelector(
          `.nai-ext-weight-value[data-index="${idx}"]`,
        );
        if (valueInput) valueInput.value = weight.toFixed(1);
        const format = e.target.dataset.format;
        const original = e.target.dataset.original;
        applyWeightToTemplate(idx, tag, weight, format, original);
      });
    });

    rows.querySelectorAll(".nai-ext-weight-value").forEach((input) => {
      input.addEventListener("change", (e) => {
        const weight = parseFloat(e.target.value);
        const tag = e.target.dataset.tag;
        const idx = parseInt(e.target.dataset.index);
        const format = e.target.dataset.format;
        const original = e.target.dataset.original;
        const slider = rows.querySelector(
          `.nai-ext-weight-slider[data-index="${idx}"]`,
        );
        if (slider) slider.value = weight;
        applyWeightToTemplate(idx, tag, weight, format, original);
      });
    });
  }

  function applyWeightToTemplate(weightIndex, tag, weight, format, original) {
    if (state.selectedTemplates.length === 0) return;
    const idx = state.selectedTemplates[0];
    const template = state.templates[idx];
    if (!template || typeof template !== "object") return;

    // Apply weight using V4.5 format by default for new weights
    const useV45 = format === "v45" || format === undefined;
    const weightedTag = WeightSyntax.applyWeight(tag, weight, useV45);

    // Replace the original tag with the new weighted tag
    if (original) {
      template.content = template.content.replace(original, weightedTag);
    } else {
      // Legacy fallback for bracket notation
      const regex = new RegExp(
        "\\{[^{}]*" + escapeRegex(tag) + "[^{}]*\\}|\\[[^\\[\\]]*" + escapeRegex(tag) + "[^\\[\\]]*\\]|-?\\d+\\.?\\d*::" + escapeRegex(tag) + "::",
      );
      template.content = template.content.replace(regex, weightedTag);
    }
    template.updatedAt = nowIso();

    saveTemplates();
    updatePreview();
    updateWeightEditor();
  }

  function updateRandomizerPreview() {
    const info = document.getElementById("nai-ext-randomizer-info");
    const previewBtn = document.getElementById("nai-ext-preview-randomizer");
    const preview = document.getElementById("nai-ext-randomizer-preview");
    const empty = document.getElementById("nai-ext-randomizer-empty");
    const actions = document.getElementById("nai-ext-randomizer-actions");

    if (!info || !previewBtn || !preview || !empty) return;

    if (state.selectedTemplates.length === 0) {
      info.style.display = "none";
      previewBtn.style.display = "none";
      preview.style.display = "none";
      empty.style.display = "block";
      if (actions) actions.style.display = "none";
      return;
    }

    const template = state.templates[state.selectedTemplates[0]];
    const content = typeof template === "object" ? template.content : template;

    const count = Randomizer.countVariations(content);

    if (count <= 1) {
      info.style.display = "none";
      previewBtn.style.display = "none";
      preview.style.display = "none";
      empty.style.display = "block";
      if (actions) actions.style.display = "none";
      return;
    }

    info.style.display = "block";
    document.getElementById("nai-ext-randomizer-count").textContent = count;
    previewBtn.style.display = "block";
    empty.style.display = "none";
    if (actions) actions.style.display = "flex";
  }

  function renderQueue() {
    const list = document.getElementById("nai-ext-queue-list");
    if (!list) return;

    if (state.queue.length === 0) {
      list.innerHTML = '<div class="nai-ext-empty">Queue is empty</div>';
      list.title = "Queue is empty.";
      document.getElementById("nai-ext-progress").style.display = "none";
      return;
    }

    list.title = `Queued prompts: ${state.queue.length}. Hover each row to inspect the full prompt.`;

    list.innerHTML = state.queue
      .map((item, index) => {
        let statusClass = "";
        let statusIcon = "○";

        const isFailed = state.failedQueueItems.includes(index);

        if (isFailed) {
          statusClass = "failed";
          statusIcon = "✗";
        } else if (index < state.currentQueueIndex) {
          statusClass = "completed";
          statusIcon = "✓";
        } else if (index === state.currentQueueIndex && state.isQueueRunning) {
          statusClass = "current";
          statusIcon = "→";
        }

        return `
                <div class="nai-ext-queue-item ${statusClass}">
                    <span class="nai-ext-queue-status">${statusIcon}</span>
                    <span class="nai-ext-queue-text" title="${escapeHtml(item)}">${escapeHtml(item)}</span>
                    ${isFailed ? `<button class="nai-ext-queue-retry" data-index="${index}" title="Retry this item">↺</button>` : ""}
              <button class="nai-ext-queue-remove" data-index="${index}" title="Remove this queued item">×</button>
                </div>
            `;
      })
      .join("");

    const progress = document.getElementById("nai-ext-progress");
    const progressLabel = document.getElementById("nai-ext-progress-label");
    const progressPercent = document.getElementById("nai-ext-progress-percent");
    const progressFill = document.getElementById("nai-ext-progress-fill");

    if (state.queue.length > 0) {
      progress.style.display = "block";
      const completed = state.currentQueueIndex;
      const total = state.queue.length;
      const percent = Math.round((completed / total) * 100);
      const { etaMs } = getQueueTimingEstimate();

      progressLabel.textContent = `${completed}/${total}`;
      progressPercent.textContent = `${percent}%`;
      progressFill.style.width = `${percent}%`;
      progress.title = etaMs !== null
        ? `Queue progress: ${completed} of ${total} completed (${percent}%). Est. finish around ${formatClockTime(Date.now() + etaMs)}.`
        : `Queue progress: ${completed} of ${total} completed (${percent}%). Finish time still calibrating.`;
      progressLabel.title = etaMs !== null
        ? `Completed ${completed} of ${total} queued prompts. ETA ${formatDurationCompact(etaMs)}.`
        : `Completed ${completed} of ${total} queued prompts.`;
      progressPercent.title = etaMs !== null
        ? `Queue progress is ${percent}%. Est. finish around ${formatClockTime(Date.now() + etaMs)}.`
        : `Queue progress is ${percent}%.`;
      progressFill.title = etaMs !== null
        ? `Queue progress bar at ${percent}%. Est. finish around ${formatClockTime(Date.now() + etaMs)}.`
        : `Queue progress bar at ${percent}%.`;
    }

    list.querySelectorAll(".nai-ext-queue-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        if (index <= state.currentQueueIndex && state.isQueueRunning) {
          return;
        }
        removeQueueEntryAt(index);
        if (index < state.currentQueueIndex) {
          state.currentQueueIndex--;
        }
        saveQueueState();
        renderQueue();
        updateButtonStates();
      });
    });

    list.querySelectorAll(".nai-ext-queue-retry").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        retrySingleItem(index);
      });
    });
  }

  function formatDurationCompact(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "0s";

    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  function formatEtaLabelCompact(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "ETA --";

    const totalMinutes = Math.ceil(ms / 60000);
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes === 0 ? `~${hours}h` : `~${hours}h${minutes}m`;
    }
    if (totalMinutes >= 1) {
      return `~${totalMinutes}m`;
    }
    return `~${Math.max(1, Math.ceil(ms / 1000))}s`;
  }

  function formatClockTime(timestamp) {
    if (!Number.isFinite(timestamp)) return "--:--";

    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function resetQueueTiming() {
    if (queueTiming.tickerId) {
      clearInterval(queueTiming.tickerId);
      queueTiming.tickerId = null;
    }

    queueTiming.startedAt = 0;
    queueTiming.elapsedRunningMs = 0;
    queueTiming.lastResumedAt = 0;
    queueTiming.currentCycleStartedAt = 0;
    queueTiming.cycleDurations = [];
    queueTiming.completedRunMs = 0;
    updateQueueTimingUI();
  }

  function startQueueTimingTicker() {
    if (queueTiming.tickerId) return;
    queueTiming.tickerId = setInterval(() => {
      updateQueueTimingUI();
    }, 1000);
  }

  function stopQueueTimingTicker() {
    if (!queueTiming.tickerId) return;
    clearInterval(queueTiming.tickerId);
    queueTiming.tickerId = null;
  }

  function resumeQueueTiming(reset = false) {
    if (reset) {
      stopQueueTimingTicker();
      queueTiming.startedAt = 0;
      queueTiming.elapsedRunningMs = 0;
      queueTiming.lastResumedAt = 0;
      queueTiming.currentCycleStartedAt = 0;
      queueTiming.cycleDurations = [];
      queueTiming.completedRunMs = 0;
    }

    if (!queueTiming.startedAt) {
      queueTiming.startedAt = Date.now();
    }
    if (!queueTiming.lastResumedAt) {
      queueTiming.lastResumedAt = Date.now();
    }

    queueTiming.completedRunMs = 0;
    startQueueTimingTicker();
    updateQueueTimingUI();
  }

  function pauseQueueTiming() {
    if (queueTiming.lastResumedAt) {
      queueTiming.elapsedRunningMs += Date.now() - queueTiming.lastResumedAt;
      queueTiming.lastResumedAt = 0;
    }
    queueTiming.currentCycleStartedAt = 0;
    stopQueueTimingTicker();
    updateQueueTimingUI();
  }

  function completeQueueTimingRun() {
    if (queueTiming.lastResumedAt) {
      queueTiming.elapsedRunningMs += Date.now() - queueTiming.lastResumedAt;
      queueTiming.lastResumedAt = 0;
    }
    queueTiming.currentCycleStartedAt = 0;
    queueTiming.completedRunMs = queueTiming.elapsedRunningMs;
    stopQueueTimingTicker();
    updateQueueTimingUI();
  }

  function beginQueueCycle() {
    if (!queueTiming.startedAt) {
      queueTiming.startedAt = Date.now();
    }
    if (!queueTiming.lastResumedAt) {
      queueTiming.lastResumedAt = Date.now();
    }
    if (!queueTiming.currentCycleStartedAt) {
      queueTiming.currentCycleStartedAt = Date.now();
    }

    startQueueTimingTicker();
    updateQueueTimingUI();
    return queueTiming.currentCycleStartedAt;
  }

  function recordQueueCycle(durationMs) {
    if (Number.isFinite(durationMs) && durationMs > 0) {
      queueTiming.cycleDurations.push(durationMs);
      if (queueTiming.cycleDurations.length > 8) {
        queueTiming.cycleDurations.shift();
      }
    }
    queueTiming.currentCycleStartedAt = 0;
    updateQueueTimingUI();
  }

  function getQueueTimingEstimate(now = Date.now()) {
    const completed = Math.min(state.currentQueueIndex, state.queue.length);
    const remaining = Math.max(state.queue.length - completed, 0);
    const elapsedMs =
      queueTiming.completedRunMs ||
      queueTiming.elapsedRunningMs +
        (queueTiming.lastResumedAt ? now - queueTiming.lastResumedAt : 0);

    let averageCycleMs = null;
    if (queueTiming.cycleDurations.length > 0) {
      averageCycleMs =
        queueTiming.cycleDurations.reduce((sum, ms) => sum + ms, 0) /
        queueTiming.cycleDurations.length;
    } else if (state.isQueueRunning && queueTiming.currentCycleStartedAt) {
      averageCycleMs = Math.max(
        now - queueTiming.currentCycleStartedAt,
        state.settings.delayBetweenGenerations + 1000,
      );
    }

    const etaMs =
      remaining > 0 && averageCycleMs !== null
        ? averageCycleMs * remaining
        : null;

    return {
      remaining,
      elapsedMs,
      averageCycleMs,
      etaMs,
    };
  }

  function updateQueueTimingUI() {
    const meta = document.getElementById("nai-ext-queue-timing");
    if (!meta) return;

    const { remaining, elapsedMs, averageCycleMs, etaMs } = getQueueTimingEstimate();

    if (state.queue.length === 0) {
      meta.textContent = "ETA --";
      meta.title = "Queue kosong, belum ada estimasi batch.";
      return;
    }

    if (state.isQueuePaused) {
      meta.textContent = etaMs !== null ? formatEtaLabelCompact(etaMs) : "Paused";
      meta.title = etaMs !== null
        ? `Queue paused. Elapsed ${formatDurationCompact(elapsedMs)}. Sisa ${remaining} item, estimasi ${formatDurationCompact(etaMs)}. Perkiraan selesai ${formatClockTime(Date.now() + etaMs)}.`
        : `Queue paused. Elapsed ${formatDurationCompact(elapsedMs)}. ETA masih dikalibrasi.`;
      return;
    }

    if (state.isQueueRunning) {
      meta.textContent = etaMs !== null ? formatEtaLabelCompact(etaMs) : "ETA ...";
      meta.title = etaMs !== null
        ? `Elapsed ${formatDurationCompact(elapsedMs)}. Avg/item ${formatDurationCompact(averageCycleMs)}. Sisa ${remaining} item. Perkiraan selesai ${formatClockTime(Date.now() + etaMs)}.`
        : `Elapsed ${formatDurationCompact(elapsedMs)}. ETA masih dikalibrasi dari item yang sedang berjalan.`;
      return;
    }

    if (remaining === 0) {
      meta.textContent = elapsedMs > 0 ? `Done ${formatDurationCompact(elapsedMs)}` : "Done";
      meta.title = elapsedMs > 0
        ? `Batch selesai dalam ${formatDurationCompact(elapsedMs)}.`
        : "Batch selesai.";
      return;
    }

    meta.textContent = etaMs !== null ? formatEtaLabelCompact(etaMs) : "ETA --";
    meta.title = etaMs !== null
      ? `Queue siap jalan. Sisa ${remaining} item, estimasi ${formatDurationCompact(etaMs)}. Perkiraan selesai ${formatClockTime(Date.now() + etaMs)}.`
      : "Estimasi batch akan muncul setelah item pertama selesai.";
  }

  function updateQueueStatus() {
    const status = document.getElementById("nai-ext-queue-status");
    if (!status) return;

    const dot = status.querySelector(".nai-ext-status-dot");
    const text = status.querySelector("span:not(.nai-ext-status-dot)");

    if (state.isQueueRunning && !state.isQueuePaused) {
      dot.className = "nai-ext-status-dot running";
      text.textContent = `Processing ${state.currentQueueIndex + 1}/${state.queue.length}...`;
    } else if (state.isQueuePaused) {
      dot.className = "nai-ext-status-dot paused";
      text.textContent = "Queue paused";
    } else if (
      state.queue.length > 0 &&
      state.currentQueueIndex >= state.queue.length
    ) {
      dot.className = "nai-ext-status-dot";
      text.textContent = "Queue completed!";
    } else {
      dot.className = "nai-ext-status-dot";
      text.textContent = state.queue.length > 0 ? "Queue ready" : "Queue idle";
    }

    // Sync footer queue dot and counter
    const footerDot = document.getElementById("nai-ext-queue-dot");
    if (footerDot) {
      footerDot.className = dot.className;
      footerDot.title = text.textContent;
    }
    const footerCounter = document.getElementById("nai-ext-queue-counter");
    if (footerCounter) {
      const done = Math.min(state.currentQueueIndex, state.queue.length);
      footerCounter.textContent = `${done}/${state.queue.length}`;
      footerCounter.title =
        state.queue.length > 0
          ? `${text.textContent}. ${done} of ${state.queue.length} queue items processed.`
          : text.textContent;
    }

    updateQueueTimingUI();
  }

  function updatePreview() {
    const preview = document.getElementById("nai-ext-preview");
    const previewNeg = document.getElementById("nai-ext-preview-negative");
    if (!preview) return;

    if (state.selectedTemplates.length === 0) {
      const emptyMessage = "Select template(s) and placeholder values to preview";
      preview.textContent = emptyMessage;
      preview.title = emptyMessage;
      preview.style.color = "#999";
      if (previewNeg) {
        previewNeg.style.display = "none";
        previewNeg.title = "";
      }
      const footerPreviewText = document.getElementById("nai-ext-footer-preview-text");
      if (footerPreviewText) {
        footerPreviewText.textContent = "No template selected";
        footerPreviewText.title = emptyMessage;
        footerPreviewText.style.color = "#888";
      }
      return;
    }

    const template = state.templates[state.selectedTemplates[0]];
    const content = typeof template === "object" ? template.content : template;

    // Get selected negative template if any
    const linkedNegativeId = getTemplateLinkedNegativeId(template);
    const negTemplate = linkedNegativeId ? findNegativeTemplateById(linkedNegativeId) : null;
    const negText = negTemplate ? (typeof negTemplate === "object" ? negTemplate.content : negTemplate) : null;

    const hasAnySelection = Object.keys(state.selectedPlaceholders).some(
      (key) => state.selectedPlaceholders[key]?.length > 0,
    );

    if (!hasAnySelection) {
      preview.textContent = content;
      preview.style.color = "#666";
    } else {
      let result = content;
      for (const [type, indices] of Object.entries(
        state.selectedPlaceholders,
      )) {
        if (indices && indices.length > 0 && state.placeholders[type]) {
          const value = state.placeholders[type][indices[0]];
          if (value) {
            const regex = new RegExp(`\\{${type}\\}`, "gi");
            result = result.replace(regex, value);
          }
        }
      }
      preview.textContent = result;
      preview.style.color = "#16a34a";
    }

    if (state.selectedTemplates.length > 1) {
      preview.textContent += ` (+${state.selectedTemplates.length - 1} more)`;
    }
    preview.title = preview.textContent;

    // Show negative preview
    if (previewNeg) {
      if (negText) {
        previewNeg.textContent = `Negative: ${negText}`;
        previewNeg.style.display = "block";
        previewNeg.title = previewNeg.textContent;
      } else {
        previewNeg.style.display = "none";
        previewNeg.title = "";
      }
    }

    // Sync footer bar inline preview text
    const footerPreviewText = document.getElementById("nai-ext-footer-preview-text");
    if (footerPreviewText) {
      footerPreviewText.textContent = preview.textContent || "No template selected";
      footerPreviewText.title = footerPreviewText.textContent;
      footerPreviewText.style.color = state.selectedTemplates.length === 0 ? "#888" : "#444";
    }
  }

  function updateButtonStates() {
    const applyBtn = document.getElementById("nai-ext-apply-prompt");
    const applyBothBtn = document.getElementById("nai-ext-apply-both");
    const addToQueueBtn = document.getElementById("nai-ext-add-to-queue");
    const startBtn = document.getElementById("nai-ext-start-queue");
    const resumeBtn = document.getElementById("nai-ext-resume-queue");
    const pauseBtn = document.getElementById("nai-ext-pause-queue");
    const stopBtn = document.getElementById("nai-ext-stop-queue");
    const clearBtn = document.getElementById("nai-ext-clear-queue");

    const hasTemplates = state.selectedTemplates.length > 0;
    const hasPlaceholders = Object.keys(state.selectedPlaceholders).some(
      (key) => state.selectedPlaceholders[key]?.length > 0,
    );
    const hasAnySelection = hasTemplates && hasPlaceholders;
    const hasQueue = state.queue.length > 0;
    const canStart =
      hasQueue &&
      !state.isQueueRunning &&
      state.currentQueueIndex < state.queue.length;

    if (applyBtn) applyBtn.disabled = !hasAnySelection;
    // Pos+Neg: enabled when there's a selection AND the selected template has a valid negative link
    if (applyBothBtn) {
      const firstTpl = hasTemplates ? state.templates[state.selectedTemplates[0]] : null;
      const linkedNegativeId = getTemplateLinkedNegativeId(firstTpl);
      const hasValidNeg = !!(linkedNegativeId && findNegativeTemplateById(linkedNegativeId));
      applyBothBtn.disabled = !hasAnySelection;
      applyBothBtn.title = hasValidNeg
        ? "Apply positive + linked negative prompt"
        : "Apply both — no negative template linked (edit template to link one)";
      applyBothBtn.style.opacity = hasAnySelection && !hasValidNeg ? "0.5" : "";
    }
    if (addToQueueBtn) addToQueueBtn.disabled = !hasAnySelection;
    if (startBtn) {
      startBtn.disabled = !canStart || state.isQueuePaused;
      startBtn.style.display = state.isQueuePaused ? "none" : "";
    }
    if (resumeBtn) {
      resumeBtn.disabled = !state.isQueuePaused;
      resumeBtn.style.display = state.isQueuePaused ? "" : "none";
    }
    if (pauseBtn)
      pauseBtn.disabled = !state.isQueueRunning || state.isQueuePaused;
    if (stopBtn) stopBtn.disabled = !state.isQueueRunning;
    if (clearBtn) clearBtn.disabled = !hasQueue || state.isQueueRunning;

    const retryFailedBtn = document.getElementById("nai-ext-retry-failed");
    if (retryFailedBtn) {
      const hasFailedItems = state.failedQueueItems.length > 0;
      retryFailedBtn.style.display = hasFailedItems ? "" : "none";
      retryFailedBtn.disabled = state.isQueueRunning;
      if (hasFailedItems) retryFailedBtn.title = `Retry ${state.failedQueueItems.length} failed item(s)`;
    }

    const deleteSelectedBtn = document.getElementById(
      "nai-ext-delete-selected",
    );
    if (deleteSelectedBtn) {
      const currentType = state.currentPlaceholderTab;
      const hasSelectedPlaceholders =
        (state.selectedPlaceholders[currentType]?.length || 0) > 0;
      deleteSelectedBtn.style.display = hasSelectedPlaceholders ? "" : "none";
    }
  }

  // ============================================
  // QUEUE PROCESSING
  // ============================================
  async function processQueue() {
    if (!state.isQueueRunning || state.isQueuePaused) return;
    if (state.currentQueueIndex >= state.queue.length) {
      state.isQueueRunning = false;
      completeQueueTimingRun();
      clearSavedQueueState();
      updateQueueStatus();
      updateButtonStates();
      renderQueue();
      return;
    }

    ensureQueueEntriesAligned();
    const prompt = state.queue[state.currentQueueIndex];
    const queueEntry = state.queueEntries[state.currentQueueIndex];
    if (queueEntry) {
      queueEntry.status = "running";
      queueEntry.startedAt = queueEntry.startedAt || nowIso();
      queueEntry.completedAt = null;
      queueEntry.error = null;
      saveQueueState();
    }

    updateQueueStatus();
    renderQueue();
  const cycleStartedAt = beginQueueCycle();

    syncFreeSafeSteps();

    NovelAI.setPrompt(prompt);

    await delay(500);

    if (!NovelAI.clickGenerate()) {
      state.isQueuePaused = true;
      pauseQueueTiming();
      if (queueEntry) {
        queueEntry.status = "pending";
        queueEntry.startedAt = null;
      }
      saveQueueState();
      updateQueueStatus();
      updateButtonStates();
      return;
    }

    const result = await NovelAI.waitForGenerationComplete();

    if (result.error) {
      console.warn(
        `NAI Ext: Generation failed for queue item ${state.currentQueueIndex}`,
      );
      if (!state.failedQueueItems.includes(state.currentQueueIndex)) {
        state.failedQueueItems.push(state.currentQueueIndex);
      }
      if (queueEntry) {
        queueEntry.status = "failed";
        queueEntry.completedAt = nowIso();
        queueEntry.error =
          typeof result.error === "string" ? result.error : "generation-failed";
      }
    } else if (queueEntry) {
      queueEntry.status = "done";
      queueEntry.completedAt = nowIso();
      queueEntry.error = null;
    }

    await delay(state.settings.delayBetweenGenerations);
  recordQueueCycle(Date.now() - cycleStartedAt);

    state.currentQueueIndex++;
    saveQueueState();
    renderQueue();

    if (!state.isQueuePaused) {
      processQueue();
    }
  }

  function startQueue() {
    if (state.queue.length === 0) return;
    ensureQueueEntriesAligned();
    if (state.currentQueueIndex >= state.queue.length) {
      state.currentQueueIndex = 0;
    }
    resumeQueueTiming(state.currentQueueIndex === 0);
    state.isQueueRunning = true;
    state.isQueuePaused = false;
    updateQueueStatus();
    updateButtonStates();
    processQueue();
  }

  function pauseQueue() {
    state.isQueuePaused = true;
    pauseQueueTiming();
    saveQueueState();
    updateQueueStatus();
    updateButtonStates();
  }

  function resumeQueue() {
    if (!state.isQueueRunning) return;
    state.isQueuePaused = false;
    resumeQueueTiming();
    updateQueueStatus();
    updateButtonStates();
    processQueue();
  }

  function clearQueue() {
    state.queue = [];
    state.queueEntries = [];
    state.failedQueueItems = [];
    state.currentQueueIndex = 0;
    state.isQueueRunning = false;
    state.isQueuePaused = false;
    state.savedQueueSnapshot = null;
    resetQueueTiming();
    clearSavedQueueState();
    renderQueue();
    updateQueueStatus();
    updateButtonStates();
  }

  function stopQueue() {
    state.isQueueRunning = false;
    state.isQueuePaused = false;
    resetQueueTiming();
    saveQueueState();
    updateQueueStatus();
    updateButtonStates();
    renderQueue();
  }

  function syncFreeSafeSteps() {
    if (!state.settings.freeSafeMode) {
      return { ok: true, skipped: true, value: null };
    }

    const syncResult = NovelAI.enforceFreeSafeSteps(CONFIG.FREE_SAFE_MAX_STEPS);
    if (!syncResult.ok) {
      console.warn("NAI Ext: Free-safe mode enabled but steps input was not found.");
    }
    return syncResult;
  }

  function updateFreeSafeToggleUI() {
    const btn = document.getElementById("nai-ext-free-safe-toggle");
    if (!btn) return;

    const enabled = !!state.settings.freeSafeMode;
    btn.textContent = enabled ? "FREE ON" : "FREE OFF";
    btn.style.background = enabled ? "var(--ekp-success)" : "var(--ekp-bg-elevated)";
    btn.style.color = enabled ? "var(--ekp-accent-fg)" : "var(--ekp-fg-primary)";
    btn.style.borderColor = enabled ? "var(--ekp-success)" : "var(--ekp-border)";
    btn.title = enabled
      ? "FREE ON: force steps to 28 immediately and before Apply+/Queue runs"
      : "FREE OFF: leave the current steps value unchanged";
  }

  function updateRandomizerToggleUI() {
    const btn = document.getElementById("nai-ext-randomizer-toggle");
    if (!btn) return;

    const enabled = !!state.settings.randomizerEnabled;
    btn.textContent = enabled ? "RAND ON" : "RAND OFF";
    btn.style.background = enabled ? "var(--ekp-info)" : "var(--ekp-bg-elevated)";
    btn.style.color = enabled ? "var(--ekp-accent-fg)" : "var(--ekp-fg-primary)";
    btn.style.borderColor = enabled ? "var(--ekp-info)" : "var(--ekp-border)";
    btn.title = enabled
      ? "RAND ON: Apply+ picks one option, Queue expands every variation"
      : "RAND OFF: keep randomizer blocks unchanged in Apply+/Queue";
  }

  function retryFailedItems() {
    if (state.failedQueueItems.length === 0) return;
    const failedEntries = state.failedQueueItems
      .map((i) => state.queueEntries[i])
      .filter(Boolean)
      .map((entry) =>
        normalizeQueueEntry({
          ...entry,
          id: createEntityId("queue"),
          status: "pending",
          createdAt: nowIso(),
          startedAt: null,
          completedAt: null,
          error: null,
        }),
      );
    state.queueEntries = failedEntries;
    state.queue = failedEntries.map((entry) => entry.resolvedPrompt);
    state.currentQueueIndex = 0;
    state.failedQueueItems = [];
    state.isQueueRunning = false;
    state.isQueuePaused = false;
    saveQueueState();
    renderQueue();
    startQueue();
  }

  async function retrySingleItem(index) {
    if (state.isQueueRunning) return;
    const prompt = state.queue[index];
    const queueEntry = state.queueEntries[index];
    if (!prompt) return;

    state.failedQueueItems = state.failedQueueItems.filter((i) => i !== index);
    state.currentQueueIndex = index;
    state.isQueueRunning = true;
    if (queueEntry) {
      queueEntry.status = "running";
      queueEntry.startedAt = nowIso();
      queueEntry.completedAt = null;
      queueEntry.error = null;
    }
    resumeQueueTiming(true);
    renderQueue();
    updateButtonStates();
    const cycleStartedAt = beginQueueCycle();

    NovelAI.setPrompt(prompt);
    await delay(500);

    if (!NovelAI.clickGenerate()) {
      state.isQueueRunning = false;
      pauseQueueTiming();
      state.failedQueueItems.push(index);
      if (queueEntry) {
        queueEntry.status = "failed";
        queueEntry.completedAt = nowIso();
        queueEntry.error = "generate-button-not-found";
      }
      saveQueueState();
      renderQueue();
      updateButtonStates();
      return;
    }

    const result = await NovelAI.waitForGenerationComplete();
    if (result.error) {
      console.warn(`NAI Ext: Retry failed for queue item ${index}`);
      state.failedQueueItems.push(index);
      if (queueEntry) {
        queueEntry.status = "failed";
        queueEntry.completedAt = nowIso();
        queueEntry.error =
          typeof result.error === "string" ? result.error : "generation-failed";
      }
    } else if (queueEntry) {
      queueEntry.status = "done";
      queueEntry.completedAt = nowIso();
      queueEntry.error = null;
    }

    recordQueueCycle(Date.now() - cycleStartedAt);
    state.isQueueRunning = false;
    state.currentQueueIndex = state.queue.length;
    completeQueueTimingRun();
    saveQueueState();
    renderQueue();
    updateQueueStatus();
    updateButtonStates();
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================
  function setupEventHandlers() {
    // Minimize button
    document
      .getElementById("nai-ext-minimize")
      ?.addEventListener("click", () => {
        document.getElementById("nai-ext-panel")?.classList.add("minimized");
      });

    // Maximize button
    document
      .getElementById("nai-ext-maximize")
      ?.addEventListener("click", () => {
        document.getElementById("nai-ext-panel")?.classList.remove("minimized");
      });

    // Restore only via the □ button — no header-click restore (prevents accidental restore after drag)

    // Close button
    document.getElementById("nai-ext-close")?.addEventListener("click", () => {
      const panel = document.getElementById("nai-ext-panel");
      if (panel) panel.style.display = "none";

      if (!document.getElementById("nai-ext-reopen")) {
        const reopenBtn = document.createElement("button");
        reopenBtn.id = "nai-ext-reopen";
        reopenBtn.textContent = "NAI";
        reopenBtn.style.cssText = `
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    padding: 6px 12px;
                    background: var(--ekp-bg-surface);
                    border: 1px solid var(--ekp-border);
                    border-radius: 5px;
                    color: var(--ekp-accent);
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    z-index: 10000;
                    font-family: "IBM Plex Mono", monospace;
                `;
        reopenBtn.addEventListener("click", () => {
          panel.style.display = "";
          reopenBtn.remove();
        });
        document.body.appendChild(reopenBtn);
      }
    });

    // Collapsible sections
    document
      .querySelectorAll(".nai-ext-section-header.collapsible")
      .forEach((header) => {
        header.addEventListener("click", () => {
          header.closest(".nai-ext-section")?.classList.toggle("collapsed");
        });
      });

    // Add template button
    document
      .getElementById("nai-ext-add-template")
      ?.addEventListener("click", () => {
        const currentPrompt = NovelAI.getCurrentPrompt();
        if (!currentPrompt) {
          alert("No prompt found in the editor. Please enter a prompt first.");
          return;
        }

        const types = Object.keys(state.placeholders);
        const typeList = types.map((t, i) => `${i + 1}. {${t}}`).join("\n");

        const templateName = prompt(
          "Enter a name for this template (optional):",
        );
        if (templateName === null) return;

        const placeholderChoice = prompt(
          `Add placeholders at beginning?\n\nAvailable:\n${typeList}\n\nEnter numbers (e.g., "1,2,3")\nLeave empty to save as-is:`,
        );
        if (placeholderChoice === null) return;

        let template = currentPrompt;
        if (placeholderChoice.trim()) {
          const indices = placeholderChoice
            .split(",")
            .map((s) => parseInt(s.trim()) - 1);
          const selectedPlaceholders = indices
            .filter((i) => i >= 0 && i < types.length)
            .map((i) => `{${types[i]}}`)
            .join(", ");

          if (selectedPlaceholders) {
            template = `${selectedPlaceholders}, ${currentPrompt}`;
          }
        }

        let category = state.currentCategoryFilter;
        if (category === "all") {
          const catList = state.categories
            .map((c, i) => `${i + 1}. ${c}`)
            .join("\n");
          const catChoice = prompt(
            `Select category:\n\n${catList}\n\nEnter number (default: 1. general):`,
          );
          if (catChoice === null) return;
          const catIdx = parseInt(catChoice.trim()) - 1;
          category =
            catIdx >= 0 && catIdx < state.categories.length
              ? state.categories[catIdx]
              : "general";
        }

        state.templates.push({
          ...normalizeTemplateRecord(
            {
              content: template,
              name: templateName.trim(),
              category,
              categoryId: ensureCategoryMeta(category).id,
            },
            "positive",
          ),
        });
        saveTemplates();
        renderTemplates();
      });

    // Template mode tabs (Positive / Negative)
    document
      .getElementById("nai-ext-template-mode-tabs")
      ?.addEventListener("click", (e) => {
        const tab = e.target.closest("[data-template-mode]");
        if (!tab) return;
        const mode = tab.dataset.templateMode;
        document.querySelectorAll("#nai-ext-template-mode-tabs .nai-ext-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("nai-ext-positive-view").style.display = mode === "positive" ? "" : "none";
        document.getElementById("nai-ext-negative-view").style.display = mode === "negative" ? "" : "none";
      });

    // Add negative template button
    document
      .getElementById("nai-ext-add-neg-template")
      ?.addEventListener("click", () => {
        const name = prompt("Name for negative template (optional):");
        if (name === null) return;
        const text = prompt("Enter negative prompt text:");
        if (text === null || !text.trim()) return;
        state.negativeTemplates.push(
          normalizeTemplateRecord(
            { content: text.trim(), name: name.trim() },
            "negative",
          ),
        );
        saveNegativeTemplates();
        renderNegativeTemplates();
      });

    // Add placeholder value button
    document
      .getElementById("nai-ext-add-value")
      ?.addEventListener("click", () => {
        const input = document.getElementById("nai-ext-value-input");
        const value = input?.value.trim();
        if (!value) return;

        addPlaceholderValue(value);
        if (input) input.value = "";
      });

    document
      .getElementById("nai-ext-value-input")
      ?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          document.getElementById("nai-ext-add-value")?.click();
        }
      });

    // Placeholder search
    document
      .getElementById("nai-ext-placeholder-search")
      ?.addEventListener("input", (e) => {
        state.placeholderSearchQuery = e.target.value.trim();
        renderPlaceholders();
      });

    // Single vs Batch mode toggle
    document
      .getElementById("nai-ext-single-mode-btn")
      ?.addEventListener("click", () => {
        document.getElementById("nai-ext-single-input-area").style.display = "flex";
        document.getElementById("nai-ext-batch-input-area").style.display = "none";
        document.getElementById("nai-ext-single-mode-btn").style.opacity = "0.7";
        document.getElementById("nai-ext-batch-mode-btn").style.opacity = "1";
      });

    document
      .getElementById("nai-ext-batch-mode-btn")
      ?.addEventListener("click", () => {
        document.getElementById("nai-ext-single-input-area").style.display = "none";
        document.getElementById("nai-ext-batch-input-area").style.display = "block";
        document.getElementById("nai-ext-single-mode-btn").style.opacity = "1";
        document.getElementById("nai-ext-batch-mode-btn").style.opacity = "0.7";
      });

    // Batch add button
    document
      .getElementById("nai-ext-batch-add")
      ?.addEventListener("click", async () => {
        const textarea = document.getElementById("nai-ext-batch-input");
        const text = textarea?.value.trim();
        if (!text) return;

        const batchBtn = document.getElementById("nai-ext-batch-add");
        if (batchBtn) {
          batchBtn.disabled = true;
          batchBtn.textContent = "Processing...";
        }

        const result = await addPlaceholderBatch(text);

        if (textarea) textarea.value = "";
        if (batchBtn) {
          batchBtn.disabled = false;
          batchBtn.textContent = "+ Add All";
        }

        alert(
          `Batch processed: ${result.seenCount} entries\nAdded: ${result.addedCount}\nSkipped duplicates: ${result.duplicateCount}`,
        );
      });

    // Placeholder values list: event delegation to avoid per-item listeners
    document
      .getElementById("nai-ext-placeholder-values")
      ?.addEventListener("click", (e) => {
        const loadMoreBtn = e.target.closest("#nai-ext-load-more-placeholders");
        if (loadMoreBtn) {
          const type = state.currentPlaceholderTab;
          const current =
            state.placeholderRenderLimit[type] ||
            CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE;
          state.placeholderRenderLimit[type] =
            current + CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE;
          renderPlaceholders();
          return;
        }

        const removeBtn = e.target.closest(".nai-ext-artist-remove");
        if (removeBtn) {
          e.stopPropagation();
          const currentType = state.currentPlaceholderTab;
          const index = parseInt(removeBtn.dataset.index, 10);
          const val = state.placeholders[currentType]?.[index];
          if (val === undefined) return;
          if (confirm(`Remove "${val}"?`)) {
            state.placeholders[currentType].splice(index, 1);
            touchPlaceholderBucket(currentType);
            if (state.selectedPlaceholders[currentType]) {
              state.selectedPlaceholders[currentType] =
                state.selectedPlaceholders[currentType]
                  .filter((i) => i !== index)
                  .map((i) => (i > index ? i - 1 : i));
            }
            savePlaceholders();
            renderPlaceholders();
            updatePreview();
            updateButtonStates();
          }
          return;
        }

        const tag = e.target.closest(".nai-ext-artist-tag");
        if (!tag) return;

        const currentType = state.currentPlaceholderTab;
        const index = parseInt(tag.dataset.index, 10);
        if (!state.selectedPlaceholders[currentType]) {
          state.selectedPlaceholders[currentType] = [];
        }
        const selectedIdx = state.selectedPlaceholders[currentType].indexOf(index);
        if (selectedIdx === -1) {
          state.selectedPlaceholders[currentType].push(index);
        } else {
          state.selectedPlaceholders[currentType].splice(selectedIdx, 1);
        }
        renderPlaceholders();
        updatePreview();
        updateButtonStates();
      });

    // Select All / Deselect All
    document
      .getElementById("nai-ext-select-all")
      ?.addEventListener("click", () => {
        const type = state.currentPlaceholderTab;
        const values = state.placeholders[type] || [];
        state.selectedPlaceholders[type] = values.map((_, i) => i);
        renderPlaceholders();
        updatePreview();
        updateButtonStates();
        updateWeightEditor();
        updateRandomizerPreview();
      });

    document
      .getElementById("nai-ext-deselect-all")
      ?.addEventListener("click", () => {
        const type = state.currentPlaceholderTab;
        state.selectedPlaceholders[type] = [];
        renderPlaceholders();
        renderPlaceholderTabs();
        updatePreview();
        updateButtonStates();
      });

    // Delete Selected
    document
      .getElementById("nai-ext-delete-selected")
      ?.addEventListener("click", () => {
        const type = state.currentPlaceholderTab;
        const selected = state.selectedPlaceholders[type] || [];
        if (selected.length === 0) return;

        if (!confirm(`Delete ${selected.length} selected ${type}(s)?`)) return;

        const sortedIndices = [...selected].sort((a, b) => b - a);
        sortedIndices.forEach((index) => {
          state.placeholders[type].splice(index, 1);
        });
        touchPlaceholderBucket(type);

        state.selectedPlaceholders[type] = [];
        savePlaceholders();
        renderPlaceholders();
        renderPlaceholderTabs();
        updatePreview();
        updateButtonStates();
      });



    // Randomizer: Pick Random & Apply
    document
      .getElementById("nai-ext-pick-random")
      ?.addEventListener("click", () => {
        if (state.selectedTemplates.length === 0) return;

        const template = state.templates[state.selectedTemplates[0]];
        let content =
          typeof template === "object" ? template.content : template;

        // Apply placeholders first
        for (const [type, indices] of Object.entries(state.selectedPlaceholders)) {
          if (indices && indices.length > 0 && state.placeholders[type]) {
            const value = state.placeholders[type][indices[0]];
            if (value) {
              const regex = new RegExp(`\\{${type}\\}`, "gi");
              content = content.replace(regex, value);
            }
          }
        }

        const variations = Randomizer.generateVariations(content);
        const random = variations[Math.floor(Math.random() * variations.length)];
        NovelAI.setPrompt(random);
      });

    // Randomizer: Queue All Variations
    document
      .getElementById("nai-ext-queue-all-variations")
      ?.addEventListener("click", () => {
        if (state.selectedTemplates.length === 0) return;

        const template = state.templates[state.selectedTemplates[0]];
        const content =
          typeof template === "object" ? template.content : template;

        const prompts = generatePromptCombinations(content);
        enqueuePrompts(prompts, template);

        saveQueueState();
        renderQueue();
        updateButtonStates();
      });

    // Randomizer preview button
    document
      .getElementById("nai-ext-preview-randomizer")
      ?.addEventListener("click", () => {
        if (state.selectedTemplates.length === 0) return;

        const template = state.templates[state.selectedTemplates[0]];
        const content =
          typeof template === "object" ? template.content : template;

        const variations = Randomizer.generateVariations(content);
        const preview = document.getElementById("nai-ext-randomizer-preview");

        if (preview) {
          preview.innerHTML =
            variations
              .slice(0, 10)
              .map(
                (v, i) =>
                  `<div class="nai-ext-randomizer-variation" data-index="${i}" style="cursor:pointer;" title="Click to apply">${escapeHtml(v)}</div>`,
              )
              .join("") +
            (variations.length > 10
              ? `<div style="color:#888;font-size:10px;">...and ${variations.length - 10} more</div>`
              : "");
          preview.style.display = "block";

          // Make variations clickable
          preview.querySelectorAll(".nai-ext-randomizer-variation").forEach((el) => {
            el.addEventListener("click", () => {
              const text = el.textContent;
              NovelAI.setPrompt(text);
            });
          });
        }
      });

    // Apply prompt button
    document
      .getElementById("nai-ext-apply-prompt")
      ?.addEventListener("click", () => {
        applyPrompt(false);
      });

    // Apply both positive and negative
    document
      .getElementById("nai-ext-apply-both")
      ?.addEventListener("click", () => {
        applyPrompt(true);
      });

    // Add to queue button
    document
      .getElementById("nai-ext-add-to-queue")
      ?.addEventListener("click", () => {
        if (state.selectedTemplates.length === 0) return;

        state.selectedTemplates.forEach((templateIdx) => {
          const template = state.templates[templateIdx];
          const content =
            typeof template === "object" ? template.content : template;
          const prompts = generatePromptCombinations(content);
          enqueuePrompts(prompts, template);
        });

        saveQueueState();
        renderQueue();
        updateButtonStates();
      });

    // Queue control buttons
    document
      .getElementById("nai-ext-start-queue")
      ?.addEventListener("click", startQueue);
    document
      .getElementById("nai-ext-resume-queue")
      ?.addEventListener("click", resumeQueue);
    document
      .getElementById("nai-ext-pause-queue")
      ?.addEventListener("click", pauseQueue);
    document
      .getElementById("nai-ext-stop-queue")
      ?.addEventListener("click", stopQueue);
    document
      .getElementById("nai-ext-clear-queue")
      ?.addEventListener("click", clearQueue);
    document
      .getElementById("nai-ext-retry-failed")
      ?.addEventListener("click", retryFailedItems);

    // Settings - delay
    document
      .getElementById("nai-ext-delay")
      ?.addEventListener("change", (e) => {
        state.settings.delayBetweenGenerations =
          parseInt(e.target.value) || 2000;
        saveSettings();
      });

    document
      .getElementById("nai-ext-free-safe-toggle")
      ?.addEventListener("click", () => {
        state.settings.freeSafeMode = !state.settings.freeSafeMode;
        saveSettings();
        updateFreeSafeToggleUI();
        syncFreeSafeSteps();
      });

    document.addEventListener(
      "change",
      (e) => {
        if (!state.settings.freeSafeMode) return;
        const stepsInput = NovelAI.getStepsInput();
        if (!stepsInput || e.target !== stepsInput) return;
        syncFreeSafeSteps();
      },
      true,
    );

    document
      .getElementById("nai-ext-randomizer-toggle")
      ?.addEventListener("click", () => {
        state.settings.randomizerEnabled = !state.settings.randomizerEnabled;
        saveSettings();
        updateRandomizerToggleUI();
      });

    // Export button
    document
      .getElementById("nai-ext-export")
      ?.addEventListener("click", exportConfig);

    // Import button
    document.getElementById("nai-ext-import")?.addEventListener("click", () => {
      document.getElementById("nai-ext-import-file")?.click();
    });

    document
      .getElementById("nai-ext-import-file")
      ?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) importConfig(file);
        e.target.value = "";
      });

    // Batch Raw Import modal
    function parseBatchPrompts(raw) {
      return raw
        .split(/^---$/m)
        .map((block) => block.trim())
        .filter((block) => block.length > 0);
    }

    document.getElementById("nai-ext-batch-import")?.addEventListener("click", () => {
      const modal = document.getElementById("nai-ext-batch-modal");
      const textarea = document.getElementById("nai-ext-batch-textarea");
      const countEl = document.getElementById("nai-ext-batch-count");
      if (!modal) return;
      textarea.value = "";
      countEl.textContent = "0 prompts detected";
      document.getElementById("nai-ext-batch-confirm").disabled = true;
      modal.classList.add("open");
      textarea.focus();
    });

    document.getElementById("nai-ext-batch-textarea")?.addEventListener("input", () => {
      const raw = document.getElementById("nai-ext-batch-textarea").value;
      const prompts = parseBatchPrompts(raw);
      const countEl = document.getElementById("nai-ext-batch-count");
      const confirmBtn = document.getElementById("nai-ext-batch-confirm");
      countEl.textContent = `${prompts.length} prompt${prompts.length !== 1 ? "s" : ""} detected`;
      confirmBtn.disabled = prompts.length === 0;
    });

    function closeBatchModal() {
      document.getElementById("nai-ext-batch-modal")?.classList.remove("open");
    }

    document.getElementById("nai-ext-batch-close")?.addEventListener("click", closeBatchModal);
    document.getElementById("nai-ext-batch-cancel")?.addEventListener("click", closeBatchModal);

    document.getElementById("nai-ext-batch-confirm")?.addEventListener("click", () => {
      const raw = document.getElementById("nai-ext-batch-textarea").value;
      const prompts = parseBatchPrompts(raw);
      if (prompts.length === 0) return;
      enqueuePrompts(prompts);
      saveQueueState();
      renderQueue();
      updateButtonStates();
      closeBatchModal();
    });

    // Help modal open / close
    document.getElementById("nai-ext-help")?.addEventListener("click", () => {
      document.getElementById("nai-ext-help-modal")?.classList.add("open");
    });
    document.getElementById("nai-ext-help-close")?.addEventListener("click", () => {
      document.getElementById("nai-ext-help-modal")?.classList.remove("open");
    });

    // Model selector buttons (quality strip)
    document.getElementById("nai-ext-model-tabs")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".nai-ext-model-btn");
      if (!btn) return;
      state.settings.currentModel = btn.dataset.model;
      saveSettings();
      updateQualityTagsUI();
      updateAnlasUI(); // base cost changes per model
    });

    // Insert quality tags button
    document.getElementById("nai-ext-insert-quality-tags")?.addEventListener("click", () => {
      const model = state.settings.currentModel || "v45_full";
      const preset = QUALITY_TAG_PRESETS[model] || QUALITY_TAG_PRESETS.v45_full;
      const current = NovelAI.getCurrentPrompt();
      const newPrompt = current ? `${current}, ${preset.tags}` : preset.tags;
      NovelAI.setPrompt(newPrompt);
    });

    // Anlas calculator — Opus plan toggle
    document.getElementById("nai-ext-opus-toggle")?.addEventListener("click", () => {
      state.settings.opusPlan = !state.settings.opusPlan;
      saveSettings();
      updateAnlasUI();
    });

    // Precise Reference spinner
    document.getElementById("nai-ext-ref-inc")?.addEventListener("click", () => {
      state.settings.preciseRefCount = (state.settings.preciseRefCount || 0) + 1;
      saveSettings();
      updateAnlasUI();
    });
    document.getElementById("nai-ext-ref-dec")?.addEventListener("click", () => {
      state.settings.preciseRefCount = Math.max(0, (state.settings.preciseRefCount || 0) - 1);
      saveSettings();
      updateAnlasUI();
    });

    // Vibe Transfer spinner
    document.getElementById("nai-ext-vibe-inc")?.addEventListener("click", () => {
      state.settings.vibeCount = (state.settings.vibeCount || 0) + 1;
      saveSettings();
      updateAnlasUI();
    });
    document.getElementById("nai-ext-vibe-dec")?.addEventListener("click", () => {
      state.settings.vibeCount = Math.max(0, (state.settings.vibeCount || 0) - 1);
      saveSettings();
      updateAnlasUI();
    });

    makeDraggable(document.getElementById("nai-ext-panel"));
  }

  function insertTag(tags) {
    const currentPrompt = NovelAI.getCurrentPrompt();
    const newPrompt = currentPrompt ? `${currentPrompt}, ${tags}` : tags;
    NovelAI.setPrompt(newPrompt);
  }

  // Approximate T5 SentencePiece token count (heuristic: ~1 token per 5 chars per word)
  function estimateT5Tokens(text) {
    if (!text || !text.trim()) return 0;
    const words = text.split(/\s+/).filter(Boolean);
    let total = 0;
    for (const w of words) {
      total += Math.max(1, Math.ceil(w.length / 5));
    }
    return total;
  }

  function initAnlasAutoDetect() {
    let debounceTimer = null;

    function scan() {
      const f = NovelAI.detectAnlasFactors();
      let changed = false;

      if (f.vibeCount !== null && f.vibeCount !== state.settings.vibeCount) {
        state.settings.vibeCount = f.vibeCount;
        changed = true;
      }
      if (f.preciseRefCount !== null && f.preciseRefCount !== state.settings.preciseRefCount) {
        state.settings.preciseRefCount = f.preciseRefCount;
        changed = true;
      }
      if (f.opusPlan !== null && f.opusPlan !== state.settings.opusPlan) {
        state.settings.opusPlan = f.opusPlan;
        changed = true;
      }
      if (changed) {
        saveSettings();
        updateAnlasUI();
      }

      // Free indicator: visual only (NAI UI shows 0 Anlas)
      const costEl = document.getElementById("nai-ext-anlas-cost");
      if (costEl && f.isFree === true) {
        costEl.classList.add("free");
        costEl.title = "NAI UI indicates this generation costs 0 Anlas";
      }
    }

    // Initial scan after NAI finishes loading
    setTimeout(scan, 2500);

    // Poll every 4 seconds
    setInterval(scan, 4000);

    // Also react instantly to DOM changes (user adds/removes reference images)
    let observer;
    try {
      observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scan, 700);
      });
      const root = document.querySelector("main, #app, #root") || document.body;
      observer.observe(root, { childList: true, subtree: true });
    } catch (e) { /* fallback: polling only */ }
  }

  function initTokenCounter() {
    const editor = NovelAI.getPromptEditor();
    if (!editor) return;

    function refresh() {
      const count = estimateT5Tokens((editor.innerText || "").trim());
      const el = document.getElementById("nai-ext-token-count");
      if (!el) return;
      el.textContent = `~${count}/512`;
      el.className = count > 480 ? "over" : count > 400 ? "warn" : "ok";
    }

    refresh();
    new MutationObserver(refresh).observe(editor, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function updateQualityTagsUI() {
    const model = (state.settings.currentModel) || "v45_full";
    const preset = QUALITY_TAG_PRESETS[model] || QUALITY_TAG_PRESETS.v45_full;

    const label = document.getElementById("nai-ext-quality-model-label");
    if (label) label.textContent = preset.label;

    const preview = document.getElementById("nai-ext-quality-tags-preview");
    if (preview) preview.textContent = preset.tags;

    document.querySelectorAll(".nai-ext-model-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.model === model);
    });
  }

  function calculateAnlas() {
    const s = state.settings;
    const model = s.currentModel || "v45_full";
    const opus = !!s.opusPlan;
    const refs = Math.max(0, s.preciseRefCount || 0);
    const vibes = Math.max(0, s.vibeCount || 0);

    // Base cost
    let base = 0;
    if (model === "v45_full" && opus) {
      base = 0; // Opus plan: V4.5 Full is free
    } else if (model === "v45_full") {
      base = 5; // Non-Opus V4.5 Full approximate
    } else if (model === "v45_curated") {
      base = 5;
    } else if (model === "v4_full" || model === "v4_curated") {
      base = 5;
    } else {
      base = 4; // V3 approximate
    }

    const refCost = refs * 5;
    // First 4 vibes are free, 5th+ costs +2 each
    const vibeCost = vibes > 4 ? (vibes - 4) * 2 : 0;
    const total = base + refCost + vibeCost;

    return { base, refCost, vibeCost, total, refs, vibes, opus, model };
  }

  function updateAnlasUI() {
    const s = state.settings;
    const { base, refCost, vibeCost, total, refs, vibes, opus } = calculateAnlas();

    // Counters
    const refCountEl = document.getElementById("nai-ext-ref-count");
    if (refCountEl) refCountEl.textContent = refs;
    const vibeCountEl = document.getElementById("nai-ext-vibe-count");
    if (vibeCountEl) vibeCountEl.textContent = vibes;

    // Opus toggle
    const opusBtn = document.getElementById("nai-ext-opus-toggle");
    if (opusBtn) {
      opusBtn.textContent = opus ? "OPUS ON" : "OFF";
      opusBtn.classList.toggle("active", opus);
    }

    // Badge in bar
    const costEl = document.getElementById("nai-ext-anlas-cost");
    if (costEl) {
      costEl.textContent = `${total} Anlas`;
      costEl.className = total === 0 ? "free" : total <= 10 ? "cheap" : "costly";
      costEl.title = `~${total} Anlas/image`;
    }

    // Bar label
    const barLabel = document.getElementById("nai-ext-anlas-bar-label");
    if (barLabel) barLabel.textContent = opus ? "Anlas/img (Opus)" : "Anlas/img";

    // Breakdown panel
    const breakdown = document.getElementById("nai-ext-anlas-breakdown");
    if (breakdown) {
      const lines = [];
      lines.push(`Base:     ${base} Anlas${base === 0 ? " (Opus free!)" : ""}`);
      if (refCost > 0) lines.push(`Ref ×${refs}:  +${refCost} Anlas`);
      if (vibes > 0) {
        const freeVibes = Math.min(vibes, 4);
        const paidVibes = Math.max(0, vibes - 4);
        lines.push(`Vibe ×${vibes}: ${freeVibes} free${paidVibes > 0 ? `, ${paidVibes} paid +${vibeCost}` : ""}`);
      }
      lines.push(`──────────────`);
      lines.push(`Total:    ${total} Anlas`);
      breakdown.textContent = lines.join("\n");
    }
  }

  function appendTags(tags) {
    const currentPrompt = NovelAI.getCurrentPrompt();
    const newPrompt = currentPrompt ? `${currentPrompt}, ${tags.join(", ")}` : tags.join(", ");
    NovelAI.setPrompt(newPrompt);
  }

  function applyPrompt(includeNegative) {
    if (state.selectedTemplates.length === 0) return;

    const template = state.templates[state.selectedTemplates[0]];
    let content = typeof template === "object" ? template.content : template;

    // Replace placeholders
    let result = content;
    for (const [type, indices] of Object.entries(state.selectedPlaceholders)) {
      if (indices && indices.length > 0 && state.placeholders[type]) {
        const value = state.placeholders[type][indices[0]];
        if (value) {
          const regex = new RegExp(`\\{${type}\\}`, "gi");
          result = result.replace(regex, value);
        }
      }
    }

    // Resolve randomizer only when enabled.
    if (state.settings.randomizerEnabled) {
      result = Randomizer.pickRandom(result);
    }

    syncFreeSafeSteps();
    NovelAI.setPrompt(result);

    if (includeNegative) {
      const linkedNegativeId = getTemplateLinkedNegativeId(template);
      const negativeTemplate = linkedNegativeId
        ? findNegativeTemplateById(linkedNegativeId)
        : null;
      const negText = negativeTemplate
        ? (typeof negativeTemplate === "object"
            ? negativeTemplate.content
            : negativeTemplate)
        : null;
      if (negText) NovelAI.setNegativePrompt(negText);
    }
  }

  function generatePromptCombinations(template) {
    const results = [];
    const selectedTypes = Object.keys(state.selectedPlaceholders).filter(
      (type) => state.selectedPlaceholders[type]?.length > 0,
    );

    if (selectedTypes.length === 0) {
      if (!state.settings.randomizerEnabled) {
        return [template];
      }
      const variations = Randomizer.generateVariations(template);
      return variations;
    }

    const valueSets = selectedTypes.map((type) =>
      state.selectedPlaceholders[type].map((idx) => ({
        type,
        value: state.placeholders[type][idx],
      })),
    );

    function cartesian(arrays, current = []) {
      if (arrays.length === 0) {
        let result = template;
        current.forEach(({ type, value }) => {
          const regex = new RegExp(`\\{${type}\\}`, "gi");
          result = result.replace(regex, value);
        });
        if (!state.settings.randomizerEnabled) {
          results.push(result);
          return;
        }
        const finalResults = Randomizer.generateVariations(result);
        finalResults.forEach((r) => results.push(r));
        return;
      }
      const [first, ...rest] = arrays;
      first.forEach((item) => cartesian(rest, [...current, item]));
    }

    cartesian(valueSets);
    return results.length > 0 ? results : [template];
  }

  function addPlaceholderValue(value, options = {}) {
    const { persist = true, rerender = true, existingSet = null } = options;
    const type = state.currentPlaceholderTab;
    if (!state.placeholders[type]) {
      state.placeholders[type] = [];
    }
    ensurePlaceholderBucket(type);

    const prefixToggle = document.getElementById("nai-ext-prefix-toggle");
    const usePrefix = prefixToggle?.checked || false;
    const finalValue = usePrefix ? `${type}:${value}` : value;

    const setToUse = existingSet || new Set(state.placeholders[type]);
    if (setToUse.has(finalValue)) {
      return false;
    }

    state.placeholders[type].push(finalValue);
  touchPlaceholderBucket(type);
    setToUse.add(finalValue);

    if (persist) savePlaceholders();
    if (rerender) renderPlaceholders();
    return true;
  }

  async function addPlaceholderBatch(rawText) {
    const type = state.currentPlaceholderTab;
    if (!state.placeholders[type]) state.placeholders[type] = [];
    ensurePlaceholderBucket(type);

    const prefixToggle = document.getElementById("nai-ext-prefix-toggle");
    const usePrefix = prefixToggle?.checked || false;

    const existingSet = new Set(state.placeholders[type]);
    let seenCount = 0;
    let addedCount = 0;
    let duplicateCount = 0;

    const flushToken = (token) => {
      const value = token.trim();
      if (!value) return;
      seenCount++;
      const finalValue = usePrefix ? `${type}:${value}` : value;
      if (existingSet.has(finalValue)) {
        duplicateCount++;
        return;
      }
      existingSet.add(finalValue);
      state.placeholders[type].push(finalValue);
      touchPlaceholderBucket(type);
      addedCount++;
    };

    let token = "";
    for (let i = 0; i < rawText.length; i++) {
      const ch = rawText[i];
      if (ch === "\n" || ch === ",") {
        flushToken(token);
        token = "";

        if (
          seenCount > 0 &&
          seenCount % CONFIG.BATCH_ADD_YIELD_INTERVAL === 0
        ) {
          await delay(0);
        }
      } else {
        token += ch;
      }
    }
    flushToken(token);

    if (addedCount > 0) {
      savePlaceholders();
      renderPlaceholders();
    }

    return { seenCount, addedCount, duplicateCount };
  }

  // ============================================
  // UTILITIES
  // ============================================
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function makeDraggable(element) {
    if (!element) return;

    const header = element.querySelector(".nai-ext-header");
    if (!header) return;

    let isDragging = false;
    let wasDragged = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".nai-ext-btn-icon")) return;

      isDragging = true;
      wasDragged = false;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    // Suppress click after drag to prevent accidental button triggers
    header.addEventListener("click", (e) => {
      if (wasDragged) {
        e.stopImmediatePropagation();
        wasDragged = false;
      }
    }, true);

    function onMouseMove(e) {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) wasDragged = true;

      element.style.left = `${startLeft + dx}px`;
      element.style.top = `${startTop + dy}px`;
      element.style.right = "auto";
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  }

  // ============================================
  // PERSISTENCE
  // ============================================
  function loadState() {
    const libraryDoc = Storage.get(CONFIG.STORAGE_KEY_LIBRARY, null);
    if (isV4LibraryDocument(libraryDoc)) {
      hydrateLibraryState(libraryDoc);
    } else {
      const legacyTemplates =
        Storage.get(CONFIG.STORAGE_KEY_TEMPLATES, null) ||
        Storage.get(CONFIG.STORAGE_KEY_LEGACY_TEMPLATES, []) ||
        [];
      const legacyArtists = Storage.get(CONFIG.STORAGE_KEY_LEGACY_ARTISTS, []) || [];
      const legacyPlaceholders =
        Storage.get(CONFIG.STORAGE_KEY_PLACEHOLDERS, null) || {
          artist: legacyArtists,
          character: [],
          style: [],
        };
      if (!legacyPlaceholders.artist && legacyArtists.length > 0) {
        legacyPlaceholders.artist = legacyArtists;
      }
      const migratedLibraryDoc = buildLibraryDocumentFromParts({
        templates: legacyTemplates,
        negativeTemplates: Storage.get(CONFIG.STORAGE_KEY_NEGATIVE_TEMPLATES, []) || [],
        placeholders: legacyPlaceholders,
        categories:
          Storage.get(CONFIG.STORAGE_KEY_CATEGORIES, null) || getDefaultCategoryLabels(),
      });
      hydrateLibraryState(migratedLibraryDoc);
      Storage.set(CONFIG.STORAGE_KEY_LIBRARY, migratedLibraryDoc);
      Storage.set(CONFIG.STORAGE_KEY_MIGRATED_V4, true);
    }

    const settingsDoc = Storage.get(CONFIG.STORAGE_KEY_SETTINGS_DOC, null);
    if (isV4SettingsDocument(settingsDoc)) {
      applySettingsDocument(settingsDoc);
    } else {
      const migratedSettingsDoc = buildSettingsDocumentFromLegacySettings(
        Storage.get(CONFIG.STORAGE_KEY_SETTINGS, {}) || {},
      );
      applySettingsDocument(migratedSettingsDoc);
      Storage.set(CONFIG.STORAGE_KEY_SETTINGS_DOC, migratedSettingsDoc);
    }

    const sessionDoc = Storage.get(CONFIG.STORAGE_KEY_SESSION, null);
    const normalizedSessionDoc = isV4SessionDocument(sessionDoc)
      ? sessionDoc
      : buildSessionDocumentFromLegacyQueueState(
          Storage.get(CONFIG.STORAGE_KEY_QUEUE_STATE, null),
        );
    if (!isV4SessionDocument(sessionDoc)) {
      Storage.set(CONFIG.STORAGE_KEY_SESSION, normalizedSessionDoc);
    }

    state.queue = [];
    state.queueEntries = [];
    state.failedQueueItems = [];
    state.currentQueueIndex = 0;
    state.isQueueRunning = false;
    state.isQueuePaused = false;
    state.savedQueueSnapshot = buildQueueResumeSnapshotFromSession(normalizedSessionDoc);
    state.lastSessionSavedAt = state.savedQueueSnapshot?.savedAt || 0;

    const lastUsedTemplateId = normalizedSessionDoc.lastUsedTemplateId;
    if (lastUsedTemplateId) {
      const selectedIndex = state.templates.findIndex(
        (template) => template.id === lastUsedTemplateId,
      );
      if (selectedIndex >= 0) {
        state.selectedTemplates = [selectedIndex];
      }
    }

    ensureDefaultPlaceholderBuckets();
    ensureCategoryMeta("general");

    Object.keys(state.placeholders).forEach((type) => {
      if (!state.placeholderRenderLimit[type]) {
        state.placeholderRenderLimit[type] =
          CONFIG.PLACEHOLDER_RENDER_PAGE_SIZE;
      }
    });

    const delayInput = document.getElementById("nai-ext-delay");
    if (delayInput) {
      delayInput.value = state.settings.delayBetweenGenerations;
    }

    updateFreeSafeToggleUI();
    updateRandomizerToggleUI();
    syncFreeSafeSteps();
  }

  function saveLibrary() {
    Storage.set(CONFIG.STORAGE_KEY_LIBRARY, buildLibraryDocument());
  }

  function saveTemplates() {
    saveLibrary();
  }

  function savePlaceholders() {
    saveLibrary();
  }

  function saveCategories() {
    saveLibrary();
  }

  function saveSettings() {
    Storage.set(CONFIG.STORAGE_KEY_SETTINGS_DOC, buildSettingsDocument());
  }

  function saveQueueState() {
    const sessionDocument = buildSessionDocument();
    Storage.set(CONFIG.STORAGE_KEY_SESSION, sessionDocument);
    state.lastSessionSavedAt = getTimestampValue(sessionDocument.updatedAt);
  }

  function clearSavedQueueState() {
    const sessionDocument = createEmptySessionDocument();
    const selectedTemplate =
      state.selectedTemplates.length > 0
        ? state.templates[state.selectedTemplates[0]]
        : null;
    sessionDocument.lastUsedTemplateId = selectedTemplate?.id || null;
    Storage.set(CONFIG.STORAGE_KEY_SESSION, sessionDocument);
    state.savedQueueSnapshot = null;
    state.lastSessionSavedAt = 0;
  }

  function showQueueResumeNotification(savedQueue) {
    const panel = document.getElementById("nai-ext-queue-panel");
    if (!panel) return;

    const remaining = savedQueue.queue.length - savedQueue.currentQueueIndex;
    const completed = savedQueue.currentQueueIndex;
    const total = savedQueue.queue.length;
    const timeStr = new Date(savedQueue.savedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const banner = document.createElement("div");
    banner.className = "nai-ext-queue-resume-banner";
    banner.id = "nai-ext-queue-resume-banner";
    banner.innerHTML = `
      <div class="nai-ext-resume-info">
        Queue belum selesai: <strong>${remaining} item tersisa</strong> dari ${total} (${completed} selesai) — tersimpan pukul ${timeStr}
      </div>
      <div class="nai-ext-resume-actions">
        <button class="nai-ext-btn secondary" id="nai-ext-resume-saved-queue" style="font-size:10px;padding:3px 8px;">Resume Queue</button>
        <button class="nai-ext-btn" id="nai-ext-discard-saved-queue" style="font-size:10px;padding:3px 8px;background:#fee2e2;border-color:#ef4444;color:#b91c1c;">Discard</button>
      </div>
    `;

    panel.insertBefore(banner, panel.firstChild);

    const strip = document.getElementById("nai-ext-queue-strip");
    if (strip) strip.classList.add("open");
    setTimeout(updateBodyPadding, 50);

    document.getElementById("nai-ext-resume-saved-queue")?.addEventListener("click", () => {
      state.queue = [...savedQueue.queue];
      state.queueEntries = savedQueue.queueEntries.map((entry) =>
        normalizeQueueEntry(entry),
      );
      state.currentQueueIndex = savedQueue.currentQueueIndex;
      state.failedQueueItems = [...(savedQueue.failedQueueItems || [])];
      state.isQueueRunning = false;
      state.isQueuePaused = false;
      state.savedQueueSnapshot = null;
      banner.remove();
      renderQueue();
      updateQueueStatus();
      updateButtonStates();
    });

    document.getElementById("nai-ext-discard-saved-queue")?.addEventListener("click", () => {
      clearSavedQueueState();
      banner.remove();
    });
  }

  function exportConfig() {
    const libraryDocument = buildLibraryDocument();

    const blob = new Blob([JSON.stringify(libraryDocument, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "library.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importConfig(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);

        if (
          !config ||
          typeof config !== "object" ||
          (!isV4LibraryDocument(config) &&
            !config.templates &&
            !config.placeholders &&
            !config.categories &&
            !config.negativeTemplates)
        ) {
          throw new Error("Invalid config file");
        }

        const normalizedLibraryDocument = isV4LibraryDocument(config)
          ? {
              schemaVersion: 4,
              exportedAt: config.exportedAt || nowIso(),
              exportedBy: config.exportedBy || `ekphrasis-studio/${CONFIG.VERSION}`,
              templates: Array.isArray(config.templates) ? config.templates : [],
              placeholders:
                config.placeholders && typeof config.placeholders === "object"
                  ? config.placeholders
                  : {},
              categories: Array.isArray(config.categories) ? config.categories : [],
            }
          : buildLibraryDocumentFromParts({
              templates: config.templates || [],
              negativeTemplates: config.negativeTemplates || [],
              placeholders: config.placeholders || {},
              categories: config.categories || getDefaultCategoryLabels(),
            });
        const importedSettingsDocument = config.settings
          ? isV4SettingsDocument(config.settings)
            ? config.settings
            : buildSettingsDocumentFromLegacySettings(config.settings)
          : null;

        const mergeChoice = confirm(
          "How do you want to import?\n\n" +
          "OK = Replace all existing data\n" +
          "Cancel = Merge with existing data (keep both)",
        );

        if (mergeChoice) {
          hydrateLibraryState(normalizedLibraryDocument);
          state.selectedTemplates = [];
          saveLibrary();
          if (importedSettingsDocument) {
            applySettingsDocument(importedSettingsDocument);
            saveSettings();
          }
        } else {
          const mergedLibraryDocument = mergeLibraryDocuments(
            buildLibraryDocument(),
            normalizedLibraryDocument,
          );
          hydrateLibraryState(mergedLibraryDocument);
          state.selectedTemplates = [];
          saveLibrary();
        }

        renderCategoryTabs();
        renderTemplates();
        renderNegativeTemplates();
        renderPlaceholderTabs();
        renderPlaceholders();
        updateButtonStates();
        updateFreeSafeToggleUI();
        updateRandomizerToggleUI();
        syncFreeSafeSteps();

        alert("Library imported successfully!");
      } catch (err) {
        alert("Failed to import configuration: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ============================================
  // FOOTER & FRAMING TAB HELPERS
  // ============================================

  function updateBodyPadding() {
    const footer = document.getElementById("nai-ext-footer");
    const body = document.querySelector("#nai-ext-panel .nai-ext-body");
    if (footer && body) {
      body.style.paddingBottom = footer.getBoundingClientRect().height + "px";
    }
  }

  function setupFooterToggles() {
    ["nai-ext-apply-bar", "nai-ext-queue-bar", "nai-ext-quality-bar", "nai-ext-anlas-bar"].forEach((barId) => {
      document.getElementById(barId)?.addEventListener("click", (e) => {
        if (e.target.closest("button:not(.nai-ext-footer-toggle), input")) return;
        const strip = e.target.closest(".nai-ext-footer-strip");
        if (strip) strip.classList.toggle("open");
        updateBodyPadding();
      });
    });

    if (window.ResizeObserver) {
      const footer = document.getElementById("nai-ext-footer");
      if (footer) new ResizeObserver(updateBodyPadding).observe(footer);
    }
  }

// ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    console.log("NAI Prompt Extension: Initializing...");

    if (typeof GM_addStyle !== "undefined") {
      GM_addStyle(STYLES);
    } else {
      const style = document.createElement("style");
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    const waitForPage = setInterval(() => {
      const editor = NovelAI.getPromptEditor();
      if (editor) {
        clearInterval(waitForPage);

        createPanel();
        loadState();
        setupEventHandlers();

        renderCategoryTabs();
        renderTemplates();
        renderNegativeTemplates();
        renderPlaceholderTabs();
        renderPlaceholders();
        renderQueue();
        updateButtonStates();
        updateQueueStatus();
        setupFooterToggles();
        initTokenCounter();
        updateQualityTagsUI();
        updateAnlasUI();
        initAnlasAutoDetect();
        setTimeout(updateBodyPadding, 150);

        if (state.savedQueueSnapshot && state.savedQueueSnapshot.queue.length > 0) {
          const savedRemaining =
            state.savedQueueSnapshot.queue.length -
            state.savedQueueSnapshot.currentQueueIndex;
          if (savedRemaining > 0) {
            showQueueResumeNotification(state.savedQueueSnapshot);
          }
        }

        console.log(`NAI Prompt Extension v${CONFIG.VERSION}: Ready!`);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(waitForPage);
    }, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
