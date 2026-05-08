// ==UserScript==
// @name         Ekphrasis
// @namespace    ekphrasis
// @version      3.5.4
// @description  Prompt studio for NovelAI — templates, weights, randomizers, and batch queue
// @author       adenaufal
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
    VERSION: "3.5.4",
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
  // STYLES - Clean Minimalist Light Theme
  // ============================================
  const STYLES = `
        /* Main Panel Container */
        #nai-ext-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 360px;
            max-height: calc(100vh - 90px);
            background: #ffffff;
            border: 2px solid #1a1a1a;
            border-radius: 0;
            box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.1);
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            color: #1a1a1a;
            z-index: 10000;
            overflow: hidden;
            transition: all 0.2s ease;
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
            color: #fff;
        }

        #nai-ext-panel.minimized #nai-ext-maximize {
            display: inline-block;
        }

        /* Sembunyikan title text saat minimized, tampilkan hanya icon */
        #nai-ext-panel.minimized .nai-ext-title span:not(.nai-ext-title-icon) {
            display: none;
        }

        /* Header jadi clickable area untuk restore saat minimized */
        #nai-ext-panel.minimized .nai-ext-header {
            cursor: pointer;
            padding: 8px 10px;
        }

        /* Header */
        .nai-ext-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: #1a1a1a;
            border-bottom: none;
            cursor: move;
            user-select: none;
        }

        .nai-ext-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 14px;
            color: #ffffff;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .nai-ext-title-icon {
            font-size: 16px;
        }

        .nai-ext-controls {
            display: flex;
            gap: 8px;
        }

        .nai-ext-btn-icon {
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 0;
            transition: all 0.15s;
            font-size: 16px;
            font-weight: bold;
        }

        .nai-ext-btn-icon:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        /* Body */
        .nai-ext-body {
            padding: 10px 12px;
            overflow-y: auto;
            max-height: calc(100vh - 130px);
            background: #ffffff;
        }

        /* Sections */
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
            padding-bottom: 6px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #1a1a1a;
            border-bottom: 2px solid #1a1a1a;
        }

        .nai-ext-section-icon {
            font-size: 12px;
            opacity: 0.8;
        }

        /* Template List */
        .nai-ext-template-list {
            display: flex;
            flex-direction: column;
            gap: 3px;
            max-height: 180px;
            overflow-y: auto;
            margin-bottom: 8px;
        }

        .nai-ext-template-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 10px;
            background: #f8f8f8;
            border-radius: 0;
            cursor: pointer;
            transition: all 0.15s;
            border: 1px solid #e0e0e0;
        }

        .nai-ext-template-item:hover {
            background: #f0f0f0;
            border-color: #1a1a1a;
        }

        .nai-ext-template-item.active {
            background: #1a1a1a;
            color: #ffffff;
            border-color: #1a1a1a;
        }

        .nai-ext-template-item.active .nai-ext-template-btn {
            color: #888;
        }

        .nai-ext-template-item.active .nai-ext-template-btn:hover {
            color: #fff;
        }

        .nai-ext-template-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            font-weight: 500;
        }

        .nai-ext-template-actions {
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.15s;
        }

        .nai-ext-template-item:hover .nai-ext-template-actions {
            opacity: 1;
        }

        .nai-ext-template-btn {
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 2px 6px;
            font-size: 12px;
            transition: color 0.15s;
        }

        .nai-ext-template-btn:hover {
            color: #1a1a1a;
        }

        .nai-ext-template-btn.delete:hover {
            color: #dc2626;
        }

        /* Artist Tags */
        .nai-ext-artist-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 8px;
        }

        .nai-ext-artist-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            background: #ffffff;
            border: 1.5px solid #1a1a1a;
            border-radius: 0;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            user-select: none;
            text-transform: lowercase;
        }

        .nai-ext-artist-tag:hover {
            background: #f0f0f0;
        }

        .nai-ext-artist-tag.selected {
            background: #1a1a1a;
            color: #ffffff;
        }

        .nai-ext-artist-remove {
            margin-left: 2px;
            opacity: 0.5;
            font-size: 10px;
            font-weight: bold;
        }

        .nai-ext-artist-remove:hover {
            opacity: 1;
            color: #dc2626;
        }

        .nai-ext-artist-tag.selected .nai-ext-artist-remove:hover {
            color: #fca5a5;
        }

        /* Inputs */
        .nai-ext-input-group {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }

        .nai-ext-input {
            flex: 1;
            padding: 7px 10px;
            background: #ffffff;
            border: 1.5px solid #d0d0d0;
            border-radius: 0;
            color: #1a1a1a;
            font-size: 12px;
            font-weight: 500;
            transition: border-color 0.15s;
        }

        .nai-ext-input:focus {
            outline: none;
            border-color: #1a1a1a;
        }

        .nai-ext-input::placeholder {
            color: #999;
            font-weight: 400;
        }

        .nai-ext-textarea {
            width: 100%;
            min-height: 50px;
            padding: 8px 10px;
            background: #ffffff;
            border: 1.5px solid #d0d0d0;
            border-radius: 0;
            color: #1a1a1a;
            font-size: 12px;
            resize: vertical;
            font-family: inherit;
        }

        .nai-ext-textarea:focus {
            outline: none;
            border-color: #1a1a1a;
        }

        /* Buttons */
        .nai-ext-btn {
            padding: 7px 14px;
            background: #1a1a1a;
            border: none;
            border-radius: 0;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.15s;
        }

        .nai-ext-btn:hover {
            background: #333333;
            transform: translateY(-1px);
        }

        .nai-ext-btn:active {
            transform: translateY(0);
        }

        .nai-ext-btn.secondary {
            background: #ffffff;
            color: #1a1a1a;
            border: 1.5px solid #1a1a1a;
        }

        .nai-ext-btn.secondary:hover {
            background: #f0f0f0;
        }

        .nai-ext-btn.danger {
            background: #dc2626;
        }

        .nai-ext-btn.danger:hover {
            background: #b91c1c;
        }

        .nai-ext-btn.success {
            background: #1a1a1a;
            position: relative;
        }

        .nai-ext-btn.success::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid #1a1a1a;
            opacity: 0;
            transition: opacity 0.15s;
        }

        .nai-ext-btn.success:hover {
            background: #333333;
        }

        .nai-ext-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }

        .nai-ext-btn-row {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }

        .nai-ext-btn-full {
            width: 100%;
        }

        /* Queue Resume Banner */
        .nai-ext-queue-resume-banner {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 6px;
            font-size: 11px;
        }
        .nai-ext-resume-info {
            color: #92400e;
            margin-bottom: 6px;
            line-height: 1.4;
        }
        .nai-ext-resume-actions {
            display: flex;
            gap: 4px;
        }

        /* Queue */
        .nai-ext-queue-list {
            display: flex;
            flex-direction: column;
            gap: 3px;
            max-height: 150px;
            overflow-y: auto;
            margin-bottom: 8px;
        }

        .nai-ext-queue-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            background: #f8f8f8;
            border-radius: 0;
            font-size: 11px;
            border: 1px solid #e0e0e0;
        }

        .nai-ext-queue-item.current {
            background: #1a1a1a;
            color: #ffffff;
            border-color: #1a1a1a;
        }

        .nai-ext-queue-item.completed {
            opacity: 0.4;
            text-decoration: line-through;
        }

        .nai-ext-queue-item.failed {
            background: #fee2e2;
            border-color: #dc2626;
            color: #991b1b;
        }

        .nai-ext-queue-item.failed .nai-ext-queue-status {
            color: #dc2626;
        }

        .nai-ext-queue-status {
            font-size: 12px;
            font-weight: bold;
        }

        .nai-ext-queue-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
        }

        .nai-ext-queue-remove {
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            font-size: 12px;
            padding: 2px;
            font-weight: bold;
        }

        .nai-ext-queue-remove:hover {
            color: #dc2626;
        }

        .nai-ext-queue-item.current .nai-ext-queue-remove:hover {
            color: #fca5a5;
        }

        .nai-ext-queue-retry {
            background: transparent;
            border: none;
            color: #d97706;
            cursor: pointer;
            font-size: 12px;
            padding: 2px;
            font-weight: bold;
        }

        .nai-ext-queue-retry:hover {
            color: #92400e;
        }

        /* Progress Bar */
        .nai-ext-progress {
            margin-bottom: 12px;
        }

        .nai-ext-progress-text {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .nai-ext-progress-bar {
            height: 8px;
            background: #e0e0e0;
            border-radius: 0;
            overflow: hidden;
        }

        .nai-ext-progress-fill {
            height: 100%;
            background: #1a1a1a;
            border-radius: 0;
            transition: width 0.3s ease;
        }

        /* Status */
        .nai-ext-status {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 10px;
            background: #f8f8f8;
            border-radius: 0;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            border: 1px solid #e0e0e0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .nai-ext-status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #999;
        }

        .nai-ext-status-dot.running {
            background: #16a34a;
            animation: pulse 1.5s infinite;
        }

        .nai-ext-status-dot.paused {
            background: #ea580c;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.9); }
        }

        /* Empty State */
        .nai-ext-empty {
            text-align: center;
            padding: 12px;
            color: #999;
            font-size: 12px;
            font-style: italic;
        }

        /* Tooltip */
        .nai-ext-tooltip {
            position: relative;
        }

        .nai-ext-tooltip::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            padding: 6px 10px;
            background: #1a1a1a;
            color: #fff;
            font-size: 10px;
            font-weight: 500;
            border-radius: 0;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s;
        }

        .nai-ext-tooltip:hover::after {
            opacity: 1;
        }

        /* Settings Toggle */
        .nai-ext-settings-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 7px 0;
            border-bottom: 1px solid #e0e0e0;
        }

        .nai-ext-settings-row:last-child {
            border-bottom: none;
        }

        .nai-ext-settings-label {
            font-size: 12px;
            font-weight: 500;
        }

        .nai-ext-number-input {
            width: 80px;
            padding: 6px 10px;
            background: #ffffff;
            border: 1.5px solid #d0d0d0;
            border-radius: 0;
            color: #1a1a1a;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
        }

        .nai-ext-number-input:focus {
            outline: none;
            border-color: #1a1a1a;
        }

        /* Scrollbar */
        .nai-ext-body::-webkit-scrollbar,
        .nai-ext-template-list::-webkit-scrollbar,
        .nai-ext-queue-list::-webkit-scrollbar {
            width: 6px;
        }

        .nai-ext-body::-webkit-scrollbar-track,
        .nai-ext-template-list::-webkit-scrollbar-track,
        .nai-ext-queue-list::-webkit-scrollbar-track {
            background: #f0f0f0;
        }

        .nai-ext-body::-webkit-scrollbar-thumb,
        .nai-ext-template-list::-webkit-scrollbar-thumb,
        .nai-ext-queue-list::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 0;
        }

        .nai-ext-body::-webkit-scrollbar-thumb:hover,
        .nai-ext-template-list::-webkit-scrollbar-thumb:hover,
        .nai-ext-queue-list::-webkit-scrollbar-thumb:hover {
            background: #aaa;
        }

        /* Collapsible Section */
        .nai-ext-section-header.collapsible {
            cursor: pointer;
        }

        .nai-ext-section-header.collapsible::after {
            content: '−';
            margin-left: auto;
            font-size: 14px;
            font-weight: bold;
            transition: transform 0.15s;
        }

        .nai-ext-section.collapsed .nai-ext-section-header.collapsible::after {
            content: '+';
        }

        .nai-ext-section.collapsed .nai-ext-section-content {
            display: none;
        }

        /* Preview area */
        #nai-ext-preview,
        #nai-ext-preview-negative {
            padding: 8px;
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            font-size: 11px;
            color: #666;
            font-family: 'Consolas', 'Monaco', monospace;
            word-break: break-all;
            max-height: 70px;
            overflow-y: auto;
        }

        #nai-ext-preview-negative {
            border-top: none;
            margin-top: 8px;
            color: #999;
            background: #f0f0f0;
        }

        /* Tabs */
        .nai-ext-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-bottom: 7px;
        }

        .nai-ext-tab {
            padding: 4px 9px;
            background: #f0f0f0;
            border: 1px solid #d0d0d0;
            font-size: 10px;
            font-weight: 600;
            text-transform: lowercase;
            cursor: pointer;
            transition: all 0.15s;
        }

        .nai-ext-tab:hover {
            background: #e0f0ff;
        }

        .nai-ext-tab.active {
            background: #1a1a1a;
            color: #fff;
            border-color: #1a1a1a;
        }

        .nai-ext-tab-add {
            padding: 4px 8px;
            font-weight: bold;
        }

        .nai-ext-tab-action {
            display: inline-block;
            margin-left: 3px;
            font-size: 9px;
            opacity: 0.55;
            cursor: pointer;
            padding: 0 2px;
            border-radius: 2px;
            vertical-align: middle;
        }

        .nai-ext-tab-action:hover {
            opacity: 1;
            background: rgba(255,255,255,0.25);
        }

        /* Placeholder values container */
        .nai-ext-placeholder-values {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 7px;
            max-height: 90px;
            overflow-y: auto;
        }

        /* Category badge on templates */
        .nai-ext-template-category {
            font-size: 9px;
            padding: 2px 6px;
            background: #e0e0e0;
            margin-left: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Checkbox row */
        .nai-ext-checkbox-row {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #666;
            cursor: pointer;
            margin-bottom: 4px;
        }

        .nai-ext-checkbox-row input[type="checkbox"] {
            width: 14px;
            height: 14px;
            accent-color: #1a1a1a;
        }

        /* Quality Preset Selector */
        .nai-ext-preset-select {
            width: 100%;
            padding: 6px 10px;
            background: #ffffff;
            border: 1.5px solid #d0d0d0;
            border-radius: 0;
            color: #1a1a1a;
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 8px;
            cursor: pointer;
        }

        .nai-ext-preset-select:focus {
            outline: none;
            border-color: #1a1a1a;
        }

        /* Weight Editor */
        .nai-ext-weight-editor {
            background: #f8f8f8;
            padding: 8px;
            border: 1px solid #e0e0e0;
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
            font-family: monospace;
        }

        .nai-ext-weight-slider {
            width: 80px;
            accent-color: #1a1a1a;
        }

        .nai-ext-weight-value {
            width: 50px;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid #d0d0d0;
            padding: 4px;
        }

        /* Randomizer Preview */
        .nai-ext-randomizer-preview {
            background: #f0f8ff;
            border: 1px solid #b0d4ff;
            padding: 7px;
            margin-bottom: 7px;
            font-size: 11px;
        }

        .nai-ext-randomizer-variation {
            padding: 4px 8px;
            margin: 4px 0;
            background: #fff;
            border: 1px solid #b0d4ff;
            cursor: pointer;
        }

        .nai-ext-randomizer-variation:hover {
            background: #e0f0ff;
        }

        /* Multi-character Section */
        .nai-ext-char-slot {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px;
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            margin-bottom: 4px;
            font-size: 11px;
            cursor: pointer;
        }

        .nai-ext-char-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            width: 60px;
        }

        /* Negative Template Items */
        .nai-ext-neg-template-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 8px;
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            margin-bottom: 4px;
            font-size: 11px;
            cursor: pointer;
        }

        .nai-ext-neg-template-item.active {
            background: #1a1a1a;
            color: #ffffff;
        }

        .nai-ext-neg-template-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Tag Group Headers */
        .nai-ext-tag-group-header {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #888;
            margin: 6px 0 4px 0;
            padding-bottom: 3px;
            border-bottom: 1px solid #e0e0e0;
        }

        /* Extra compact for 720p screens */
        @media (max-height: 800px) {
            #nai-ext-panel {
                top: 60px;
                max-height: calc(100vh - 80px);
            }
            .nai-ext-body {
                padding: 7px 9px;
                max-height: calc(100vh - 105px);
            }
            .nai-ext-section {
                margin-bottom: 9px;
            }
            .nai-ext-section-header {
                margin-bottom: 6px;
                padding-bottom: 5px;
            }
            .nai-ext-template-list {
                max-height: 140px;
            }
        }

        /* ===================== FOOTER ===================== */
        .nai-ext-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: #ffffff;
            border-top: 2px solid #1a1a1a;
            z-index: 5;
        }

        #nai-ext-panel.minimized .nai-ext-footer {
            display: none;
        }

        .nai-ext-footer-strip {
            display: flex;
            flex-direction: column;
            border-top: 1px solid #e0e0e0;
        }

        .nai-ext-footer-strip:first-child {
            border-top: none;
        }

        .nai-ext-footer-panel {
            display: none;
            padding: 7px 10px;
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
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
            background: #f8f8f8;
            user-select: none;
        }

        .nai-ext-footer-toggle {
            margin-left: auto;
            font-size: 9px;
            color: #888;
            cursor: pointer;
            padding: 2px 5px;
            background: transparent;
            border: none;
            font-weight: bold;
        }

        .nai-ext-footer-strip.open .nai-ext-footer-toggle::after { content: '▼'; }
        .nai-ext-footer-strip:not(.open) .nai-ext-footer-toggle::after { content: '▲'; }

        .nai-ext-footer-preview-text {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 10px;
            color: #888;
            font-style: italic;
        }

        .nai-ext-footer-apply-btn {
            padding: 3px 7px;
            background: #1a1a1a;
            border: none;
            color: #ffffff;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
        }

        .nai-ext-footer-apply-btn.secondary {
            background: #ffffff;
            color: #1a1a1a;
            border: 1.5px solid #1a1a1a;
        }

        .nai-ext-footer-apply-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .nai-ext-footer-apply-btn:hover:not(:disabled) {
            opacity: 0.85;
        }

        .nai-ext-footer-queue-btn {
            background: transparent;
            border: 1px solid #d0d0d0;
            color: #1a1a1a;
            cursor: pointer;
            padding: 2px 5px;
            font-size: 10px;
        }

        .nai-ext-footer-queue-btn:disabled {
            opacity: 0.35;
            cursor: not-allowed;
        }

        .nai-ext-footer-queue-btn:hover:not(:disabled) {
            background: #f0f0f0;
        }

        .nai-ext-footer-queue-counter {
            font-size: 10px;
            font-weight: 700;
            min-width: 26px;
            color: #1a1a1a;
        }

        .nai-ext-footer-label {
            font-size: 10px;
            font-weight: 600;
            color: #555;
        }

        .nai-ext-footer-number-input {
            width: 54px;
            padding: 2px 4px;
            background: #ffffff;
            border: 1.5px solid #d0d0d0;
            color: #1a1a1a;
            font-size: 10px;
            font-weight: 600;
            text-align: center;
        }

        .nai-ext-footer-number-input:focus {
            outline: none;
            border-color: #1a1a1a;
        }

        .nai-ext-footer-icon-btn {
            background: #ffffff;
            border: 1.5px solid #1a1a1a;
            color: #1a1a1a;
            cursor: pointer;
            padding: 2px 5px;
            font-size: 10px;
        }

        .nai-ext-footer-icon-btn:hover {
            background: #f0f0f0;
        }

        /* Body padding-bottom to clear footer — overridden dynamically by JS */
        .nai-ext-body {
            padding-bottom: 100px;
        }


        /* ===================== HELP MODAL ===================== */
        #nai-ext-help-modal {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #ffffff;
            z-index: 20;
            overflow-y: auto;
            padding: 12px;
        }

        #nai-ext-help-modal.open {
            display: block;
        }

        .nai-ext-help-close {
            float: right;
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 3px 8px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
        }

        .nai-ext-help-close:hover {
            background: #333333;
        }

        .nai-ext-help-section {
            margin-bottom: 14px;
        }

        .nai-ext-help-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #1a1a1a;
            padding-bottom: 4px;
            margin-bottom: 8px;
            color: #1a1a1a;
        }

        .nai-ext-help-row {
            display: flex;
            gap: 8px;
            font-size: 11px;
            margin-bottom: 3px;
            align-items: baseline;
        }

        .nai-ext-help-syntax {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10px;
            background: #f0f0f0;
            padding: 1px 5px;
            flex-shrink: 0;
            border: 1px solid #e0e0e0;
        }

        .nai-ext-help-code {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10px;
            background: #f8f8f8;
            border: 1px solid #e0e0e0;
            padding: 5px 7px;
            display: block;
            margin: 5px 0;
            word-break: break-all;
        }

        .nai-ext-help-note {
            font-size: 10px;
            color: #888;
            margin-top: 4px;
            font-style: italic;
        }

        /* ================ BATCH IMPORT MODAL ================= */
        #nai-ext-batch-modal {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #ffffff;
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
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 11px;
            border: 1px solid #d0d0d0;
            padding: 8px;
            box-sizing: border-box;
            color: #1a1a1a;
            line-height: 1.5;
        }

        #nai-ext-batch-textarea:focus {
            outline: none;
            border-color: #1a1a1a;
        }

        .nai-ext-batch-hint {
            font-size: 10px;
            color: #888;
            font-style: italic;
        }

        .nai-ext-batch-count {
            font-size: 11px;
            font-weight: bold;
            color: #1a1a1a;
        }

        .nai-ext-batch-actions {
            display: flex;
            gap: 6px;
        }
    `;

  // ============================================
  // STATE
  // ============================================
  let state = {
    // Templates as objects with id, name, content, category, negativeId
    templates: [],
    // Negative prompt templates
    negativeTemplates: [],
    // Dynamic placeholders: { artist: ['val1', 'val2'], character: ['1girl'] }
    placeholders: {
      artist: [],
      character: [],
      style: [],
    },
    // Template categories
    categories: ["general", "portraits", "landscapes"],
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
    failedQueueItems: [], // Track indices of failed generations
    isQueueRunning: false,
    isQueuePaused: false,
    currentQueueIndex: 0,
    // Settings
    settings: {
      delayBetweenGenerations: 2000,
      autoStartQueue: false,
      freeSafeMode: false,
      randomizerEnabled: false,
    },
    // Weight syntax state
    weightPresets: {}, // Custom weight presets
    // Randomizer state
    randomizerVariations: [], // Current randomizer preview variations
    // Multi-character slots
    charSlots: ["base", "char1", "char2"],
    selectedCharSlot: "base",
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
      return editors[1] || null;
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
      const editor = this.getNegativePromptEditor();
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
                    <span style="font-size:10px;background:#16a34a;padding:2px 5px;border-radius:2px;text-transform:none;letter-spacing:0;">v3</span>
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
                <div class="nai-ext-batch-hint">Paste raw prompts below. Separate each prompt with <code style="background:#f0f0f0;padding:1px 4px;border:1px solid #e0e0e0;">---</code> on its own line. Each block = 1 item in queue.</div>
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
                    <div id="nai-ext-preview" title="Resolved positive prompt preview" style="font-size:11px;color:#666;font-family:'Consolas','Monaco',monospace;word-break:break-all;background:#f8f8f8;border:1px solid #e0e0e0;padding:6px;max-height:70px;overflow-y:auto;margin-bottom:4px;">Select a template to preview</div>
                    <div id="nai-ext-preview-negative" title="Linked negative prompt preview" style="display:none;font-size:10px;color:#999;background:#f0f0f0;border:1px solid #e0e0e0;padding:5px;font-family:'Consolas','Monaco',monospace;word-break:break-all;max-height:50px;overflow-y:auto;"></div>
                    </div>
                    <div class="nai-ext-footer-bar" id="nai-ext-apply-bar">
                        <span style="font-size:11px;flex-shrink:0;">⚡</span>
                    <span class="nai-ext-footer-preview-text" id="nai-ext-footer-preview-text" title="Inline preview of the resolved prompt">No template selected</span>
                    <button class="nai-ext-footer-apply-btn" id="nai-ext-apply-prompt" disabled title="Apply the resolved positive prompt to NovelAI">Apply+</button>
                    <button class="nai-ext-footer-apply-btn secondary" id="nai-ext-apply-both" disabled title="Apply the positive prompt and its linked negative prompt">Both</button>
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
        const idx = state.categories.indexOf(oldName);
        if (idx >= 0) state.categories[idx] = trimmed;
        state.templates.forEach((t) => {
          if (typeof t === "object" && t.category === oldName)
            t.category = trimmed;
        });
        if (state.currentCategoryFilter === oldName)
          state.currentCategoryFilter = trimmed;
        saveCategories();
        saveTemplates();
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
        state.templates.forEach((t) => {
          if (typeof t === "object" && t.category === cat) t.category = "general";
        });
        state.categories = state.categories.filter((c) => c !== cat);
        if (state.currentCategoryFilter === cat)
          state.currentCategoryFilter = "all";
        saveCategories();
        saveTemplates();
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
        state.categories.push(trimmed);
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
        const catBadge = category
          ? `<span class="nai-ext-template-category">${category}</span>`
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
                    ${catBadge}
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
        const template = state.templates[index];
        const content =
          typeof template === "object" ? template.content : template;
        const currentName =
          typeof template === "object" ? template.name || "" : "";

        const newName = prompt(
          "Preset name (optional, leave empty to show prompt):",
          currentName,
        );
        if (newName === null) return;

        const newText = prompt("Edit template prompt:", content);
        if (newText !== null && newText.trim()) {
          if (typeof template === "object") {
            state.templates[index].content = newText.trim();
            state.templates[index].name = newName.trim();
          } else {
            state.templates[index] = {
              content: newText.trim(),
              name: newName.trim(),
              category: "general",
            };
          }
          saveTemplates();
          renderTemplates();
          updatePreview();
        }
      });
    });
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
        delete state.placeholders[oldName];
        delete state.selectedPlaceholders[oldName];
        state.placeholders[trimmed] = values;
        state.selectedPlaceholders[trimmed] = selected || [];
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

      progressLabel.textContent = `${completed}/${total}`;
      progressPercent.textContent = `${percent}%`;
      progressFill.style.width = `${percent}%`;
      progress.title = `Queue progress: ${completed} of ${total} completed (${percent}%)`;
      progressLabel.title = `Completed ${completed} of ${total} queued prompts`;
      progressPercent.title = `Queue progress is ${percent}%`;
      progressFill.title = `Queue progress bar at ${percent}%`;
    }

    list.querySelectorAll(".nai-ext-queue-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        if (index <= state.currentQueueIndex && state.isQueueRunning) {
          return;
        }
        state.queue.splice(index, 1);
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
    const negTemplate =
      typeof template === "object" && template.negativeId !== undefined
        ? state.negativeTemplates[template.negativeId]
        : null;

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
      if (negTemplate) {
        previewNeg.textContent = `Negative: ${negTemplate}`;
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
    if (applyBothBtn) applyBothBtn.disabled = !hasAnySelection;
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
      clearSavedQueueState();
      updateQueueStatus();
      updateButtonStates();
      renderQueue();
      return;
    }

    const prompt = state.queue[state.currentQueueIndex];

    updateQueueStatus();
    renderQueue();

    syncFreeSafeSteps();

    NovelAI.setPrompt(prompt);

    await delay(500);

    if (!NovelAI.clickGenerate()) {
      state.isQueuePaused = true;
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
      state.failedQueueItems.push(state.currentQueueIndex);
    }

    await delay(state.settings.delayBetweenGenerations);

    state.currentQueueIndex++;
    saveQueueState();
    renderQueue();

    if (!state.isQueuePaused) {
      processQueue();
    }
  }

  function startQueue() {
    if (state.queue.length === 0) return;
    if (state.currentQueueIndex >= state.queue.length) {
      state.currentQueueIndex = 0;
    }
    state.isQueueRunning = true;
    state.isQueuePaused = false;
    updateQueueStatus();
    updateButtonStates();
    processQueue();
  }

  function pauseQueue() {
    state.isQueuePaused = true;
    saveQueueState();
    updateQueueStatus();
    updateButtonStates();
  }

  function resumeQueue() {
    if (!state.isQueueRunning) return;
    state.isQueuePaused = false;
    updateQueueStatus();
    updateButtonStates();
    processQueue();
  }

  function clearQueue() {
    state.queue = [];
    state.failedQueueItems = [];
    state.currentQueueIndex = 0;
    state.isQueueRunning = false;
    state.isQueuePaused = false;
    clearSavedQueueState();
    renderQueue();
    updateQueueStatus();
    updateButtonStates();
  }

  function stopQueue() {
    state.isQueueRunning = false;
    state.isQueuePaused = false;
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
    btn.style.background = enabled ? "#16a34a" : "#ffffff";
    btn.style.color = enabled ? "#ffffff" : "#1a1a1a";
    btn.style.borderColor = enabled ? "#16a34a" : "#1a1a1a";
    btn.title = enabled
      ? "FREE ON: force steps to 28 immediately and before Apply+/Queue runs"
      : "FREE OFF: leave the current steps value unchanged";
  }

  function updateRandomizerToggleUI() {
    const btn = document.getElementById("nai-ext-randomizer-toggle");
    if (!btn) return;

    const enabled = !!state.settings.randomizerEnabled;
    btn.textContent = enabled ? "RAND ON" : "RAND OFF";
    btn.style.background = enabled ? "#2563eb" : "#ffffff";
    btn.style.color = enabled ? "#ffffff" : "#1a1a1a";
    btn.style.borderColor = enabled ? "#2563eb" : "#1a1a1a";
    btn.title = enabled
      ? "RAND ON: Apply+ picks one option, Queue expands every variation"
      : "RAND OFF: keep randomizer blocks unchanged in Apply+/Queue";
  }

  function retryFailedItems() {
    if (state.failedQueueItems.length === 0) return;
    const failedPrompts = state.failedQueueItems.map((i) => state.queue[i]);
    state.queue = failedPrompts;
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
    if (!prompt) return;

    state.failedQueueItems = state.failedQueueItems.filter((i) => i !== index);
    state.currentQueueIndex = index;
    state.isQueueRunning = true;
    renderQueue();
    updateButtonStates();

    NovelAI.setPrompt(prompt);
    await delay(500);

    if (!NovelAI.clickGenerate()) {
      state.isQueueRunning = false;
      state.failedQueueItems.push(index);
      renderQueue();
      updateButtonStates();
      return;
    }

    const result = await NovelAI.waitForGenerationComplete();
    if (result.error) {
      console.warn(`NAI Ext: Retry failed for queue item ${index}`);
      state.failedQueueItems.push(index);
    }

    state.isQueueRunning = false;
    state.currentQueueIndex = state.queue.length;
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
                    padding: 6px 10px;
                    background: #1a1a1a;
                    border: 2px solid #1a1a1a;
                    color: #fff;
                    font-size: 11px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    cursor: pointer;
                    z-index: 10000;
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
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
          content: template,
          name: templateName.trim(),
          category: category,
        });
        saveTemplates();
        renderTemplates();
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
        prompts.forEach((p) => state.queue.push(p));

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
          prompts.forEach((p) => state.queue.push(p));
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
      prompts.forEach((p) => state.queue.push(p));
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

    makeDraggable(document.getElementById("nai-ext-panel"));
  }

  function insertTag(tags) {
    const currentPrompt = NovelAI.getCurrentPrompt();
    const newPrompt = currentPrompt ? `${currentPrompt}, ${tags}` : tags;
    NovelAI.setPrompt(newPrompt);
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
      const negId =
        typeof template === "object" ? template.negativeId : undefined;
      if (negId !== undefined && state.negativeTemplates[negId]) {
        NovelAI.setNegativePrompt(state.negativeTemplates[negId]);
      }
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

    const prefixToggle = document.getElementById("nai-ext-prefix-toggle");
    const usePrefix = prefixToggle?.checked || false;
    const finalValue = usePrefix ? `${type}:${value}` : value;

    const setToUse = existingSet || new Set(state.placeholders[type]);
    if (setToUse.has(finalValue)) {
      return false;
    }

    state.placeholders[type].push(finalValue);
    setToUse.add(finalValue);

    if (persist) savePlaceholders();
    if (rerender) renderPlaceholders();
    return true;
  }

  async function addPlaceholderBatch(rawText) {
    const type = state.currentPlaceholderTab;
    if (!state.placeholders[type]) state.placeholders[type] = [];

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
    // Try loading v3 data first
    const templatesV3 = Storage.get(CONFIG.STORAGE_KEY_TEMPLATES, null);

    if (templatesV3) {
      state.templates = templatesV3;
      state.placeholders = Storage.get(CONFIG.STORAGE_KEY_PLACEHOLDERS, {
        artist: [],
        character: [],
        style: [],
      });
      state.categories = Storage.get(CONFIG.STORAGE_KEY_CATEGORIES, [
        "general",
        "portraits",
        "landscapes",
      ]);
      state.negativeTemplates = Storage.get(
        CONFIG.STORAGE_KEY_NEGATIVE_TEMPLATES,
        [],
      );
    } else {
      // Try migrating from v2
      const templatesV2 = Storage.get(
        CONFIG.STORAGE_KEY_LEGACY_TEMPLATES,
        null,
      );
      if (templatesV2) {
        console.log("NAI Ext: Migrating from v2 data...");
        state.templates = templatesV2;
        state.placeholders = Storage.get(CONFIG.STORAGE_KEY_PLACEHOLDERS, {
          artist: [],
          character: [],
          style: [],
        });
        state.categories = Storage.get(CONFIG.STORAGE_KEY_CATEGORIES, [
          "general",
          "portraits",
          "landscapes",
        ]);
        saveTemplates();
        savePlaceholders();
      } else {
        // Try migrating from v1
        const legacyTemplates = Storage.get(
          CONFIG.STORAGE_KEY_LEGACY_TEMPLATES,
          [],
        );
        const legacyArtists = Storage.get(
          CONFIG.STORAGE_KEY_LEGACY_ARTISTS,
          [],
        );

        if (legacyTemplates.length > 0 || legacyArtists.length > 0) {
          console.log("NAI Ext: Migrating from v1 data...");
          state.templates = legacyTemplates;
          state.placeholders = {
            artist: legacyArtists,
            character: [],
            style: [],
          };
          saveTemplates();
          savePlaceholders();
        }
      }
    }

    state.settings = Storage.get(CONFIG.STORAGE_KEY_SETTINGS, {
      delayBetweenGenerations: 2000,
      autoStartQueue: false,
      freeSafeMode: false,
      randomizerEnabled: CONFIG.RANDOMIZER_DEFAULT_ENABLED,
    });

    if (typeof state.settings.freeSafeMode !== "boolean") {
      state.settings.freeSafeMode = false;
    }
    if (typeof state.settings.randomizerEnabled !== "boolean") {
      state.settings.randomizerEnabled = CONFIG.RANDOMIZER_DEFAULT_ENABLED;
    }

    if (!state.placeholders.artist) state.placeholders.artist = [];
    if (!state.placeholders.character) state.placeholders.character = [];
    if (!state.placeholders.style) state.placeholders.style = [];

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

  function saveTemplates() {
    Storage.set(CONFIG.STORAGE_KEY_TEMPLATES, state.templates);
  }

  function savePlaceholders() {
    Storage.set(CONFIG.STORAGE_KEY_PLACEHOLDERS, state.placeholders);
  }

  function saveCategories() {
    Storage.set(CONFIG.STORAGE_KEY_CATEGORIES, state.categories);
  }

  function saveSettings() {
    Storage.set(CONFIG.STORAGE_KEY_SETTINGS, state.settings);
  }

  function saveQueueState() {
    if (state.queue.length === 0) {
      Storage.set(CONFIG.STORAGE_KEY_QUEUE_STATE, null);
      return;
    }
    Storage.set(CONFIG.STORAGE_KEY_QUEUE_STATE, {
      queue: state.queue,
      currentQueueIndex: state.currentQueueIndex,
      failedQueueItems: state.failedQueueItems,
      savedAt: Date.now(),
    });
  }

  function clearSavedQueueState() {
    Storage.set(CONFIG.STORAGE_KEY_QUEUE_STATE, null);
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
      state.queue = savedQueue.queue;
      state.currentQueueIndex = savedQueue.currentQueueIndex;
      state.failedQueueItems = savedQueue.failedQueueItems || [];
      state.isQueueRunning = false;
      state.isQueuePaused = false;
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
    const config = {
      version: CONFIG.VERSION,
      exportDate: new Date().toISOString(),
      templates: state.templates,
      placeholders: state.placeholders,
      categories: state.categories,
      negativeTemplates: state.negativeTemplates,
      settings: state.settings,
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nai-prompt-config-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importConfig(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);

        if (!config.templates && !config.placeholders) {
          throw new Error("Invalid config file");
        }

        const mergeChoice = confirm(
          "How do you want to import?\n\n" +
          "OK = Replace all existing data\n" +
          "Cancel = Merge with existing data (keep both)",
        );

        if (mergeChoice) {
          state.templates = config.templates || [];
          state.placeholders = config.placeholders || {
            artist: [],
            character: [],
            style: [],
          };
          state.categories = config.categories || [
            "general",
            "portraits",
            "landscapes",
          ];
          state.negativeTemplates = config.negativeTemplates || [];
          if (config.settings) state.settings = config.settings;
        } else {
          if (config.templates) {
            config.templates.forEach((t) => {
              const content = typeof t === "object" ? t.content : t;
              const exists = state.templates.some(
                (st) => (typeof st === "object" ? st.content : st) === content,
              );
              if (!exists) state.templates.push(t);
            });
          }
          if (config.placeholders) {
            for (const [type, values] of Object.entries(config.placeholders)) {
              if (!state.placeholders[type]) state.placeholders[type] = [];
              values.forEach((v) => {
                if (!state.placeholders[type].includes(v)) {
                  state.placeholders[type].push(v);
                }
              });
            }
          }
          if (config.categories) {
            config.categories.forEach((c) => {
              if (!state.categories.includes(c)) state.categories.push(c);
            });
          }
        }

        saveTemplates();
        savePlaceholders();
        saveCategories();
        saveSettings();

        renderCategoryTabs();
        renderTemplates();
        renderPlaceholderTabs();
        renderPlaceholders();
        updateButtonStates();
        updateFreeSafeToggleUI();
        updateRandomizerToggleUI();
        syncFreeSafeSteps();

        alert("Configuration imported successfully!");
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
    ["nai-ext-apply-bar", "nai-ext-queue-bar"].forEach((barId) => {
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
        renderPlaceholderTabs();
        renderPlaceholders();
        renderQueue();
        updateButtonStates();
        updateQueueStatus();
        setupFooterToggles();
        setTimeout(updateBodyPadding, 150);

        const savedQueueData = Storage.get(CONFIG.STORAGE_KEY_QUEUE_STATE, null);
        if (savedQueueData && savedQueueData.queue && savedQueueData.queue.length > 0) {
          const savedRemaining = savedQueueData.queue.length - savedQueueData.currentQueueIndex;
          if (savedRemaining > 0) {
            showQueueResumeNotification(savedQueueData);
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
