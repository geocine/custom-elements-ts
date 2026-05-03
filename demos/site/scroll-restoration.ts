function scrollToHashTarget(): boolean {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) return false;
  target.scrollIntoView();
  return true;
}

function syncInitialScroll() {
  if (typeof window === 'undefined') return;

  if (window.location.hash) {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'auto';
    }
    requestAnimationFrame(scrollToHashTarget);
    return;
  }

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

syncInitialScroll();
window.addEventListener('pageshow', syncInitialScroll);
