/**
 * Delegates [Source] button clicks to matching <cts-source-viewer> panels.
 */

const TOGGLE_ATTR = 'data-source-toggle';
const TARGET_ATTR = 'data-source-target';
const OPEN_ATTR = 'open';
const ACTIVE_CLASS = 'is-active';

// Sticky-nav height plus breathing room.
const SCROLL_OFFSET = 88;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function scrollPanelIntoView(panel: HTMLElement) {
  // Wait for [open] to land before measuring the panel.
  requestAnimationFrame(() => {
    const top = panel.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    if (top <= window.scrollY) return;
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

  // Closing should leave the user where they are.
  if (willOpen) {
    scrollPanelIntoView(panel);
  }
}

function init() {
  // Reflect any initially open panels.
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
