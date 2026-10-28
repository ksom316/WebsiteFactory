/**
 * Shared page-title treatment — the one editorial moment most pages get (see
 * README-style rationale in UX Polish 1's report). Serif, used sparingly and only
 * here; everything functional (nav, forms, tables, buttons) stays on the sans
 * interface face from src/index.css's --font-sans. Centralizing this as a single
 * constant, rather than repeating the same Tailwind string on every page, is what
 * keeps the six page titles (Dashboard, Projects, New project, Templates, Settings,
 * Project detail) consistent as a group.
 */
export const pageTitleClass = 'font-serif text-[28px] font-medium leading-tight tracking-tight text-text'

/** Companion description/subhead text directly under a page title. */
export const pageDescriptionClass = 'max-w-xl text-[15px] leading-relaxed text-text-muted'
