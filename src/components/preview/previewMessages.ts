/**
 * postMessage contract between the project editor's live preview panel and the
 * `/templates/preview?mode=draft` iframe it embeds. Kept same-origin-only on both ends
 * (every sender checks/sets `window.location.origin`, never `'*'`), and the payload is
 * a plain CorporateConfig object — no HTML, no executable content, nothing that
 * couldn't already be reached by calling parseCorporateConfig directly.
 */
export const PREVIEW_READY_MESSAGE = 'wf-preview-ready'
export const PREVIEW_CONFIG_MESSAGE = 'wf-preview-config'
