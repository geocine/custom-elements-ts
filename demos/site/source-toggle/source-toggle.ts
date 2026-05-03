/**
 * Wires up the [Source] toggle buttons in the playground headers to the
 * matching <cts-source-viewer> panels.
 *
 * Buttons opt in declaratively:
 *
 *   <button data-source-toggle data-source-target="src-counter"
 *           aria-controls="src-counter" aria-expanded="false">…</button>
 *   <cts-source-viewer id="src-counter" slug="counter"></cts-source-viewer>
 *
 * One delegated click handler covers the whole document so any number of
 * playgrounds work without per-instance JS.
 */

const TOGGLE_ATTR = 'data-source-toggle';
const TARGET_ATTR = 'data-source-target';
const OPEN_ATTR = 'open';
const ACTIVE_CLASS = 'is-active';

// Sticky-nav height (64px) + a touch of breathing room. Used as the scroll
// offset when bringing a freshly-opened source panel into view.
const SCROLL_OFFSET = 88;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function scrollPanelIntoView(panel: HTMLElement) {
  // Wait one frame so the [open] attribute lands and the grid-template-rows
  // transition has begun. We compute the absolute target so the smooth scroll
  // doesn't fight the panel's own height animation.
  requestAnimationFrame(() => {
    const top = panel.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    if (top <= window.scrollY) return; // already above the fold; don't yank the page up
    window.scrollTo({
      top,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });
}

function findToggle(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest(`[${TOGGLE_ATTR}]`) as HTMLElement | null;
}

function syncTrigger(trigger: HTMLElement, isOpen: boolean) {
  trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  trigger.classList.toggle(ACTIVE_CLASS, isOpen);
}

function handleClick(event: MouseEvent) {
  const trigger = findToggle(event.target);
  if (!trigger) return;

  const targetId = trigger.getAttribute(TARGET_ATTR);
  if (!targetId) return;

  const panel = document.getElementById(targetId);
  if (!panel) return;

  event.preventDefault();

  const willOpen = !panel.hasAttribute(OPEN_ATTR);
  if (willOpen) {
    panel.setAttribute(OPEN_ATTR, '');
  } else {
    panel.removeAttribute(OPEN_ATTR);
  }
  syncTrigger(trigger, willOpen);

  // Bring the panel into view only on the open path — closing should leave
  // the user where they were.
  if (willOpen) {
    scrollPanelIntoView(panel);
  }
}

function init() {
  // Reflect the initial DOM state in case a server-side preview ships with
  // an [open] panel already mounted.
  document.querySelectorAll<HTMLElement>(`[${TOGGLE_ATTR}]`).forEach((trigger) => {
    const targetId = trigger.getAttribute(TARGET_ATTR);
    if (!targetId) return;
    const panel = document.getElementById(targetId);
    if (!panel) return;
    syncTrigger(trigger, panel.hasAttribute(OPEN_ATTR));
  });

  document.addEventListener('click', handleClick);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
