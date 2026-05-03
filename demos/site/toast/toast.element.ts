import { CustomElement } from 'custom-elements-ts';

interface ToastDetail {
  title: string;
  message?: string;
  kind?: 'success' | 'error' | 'info';
}

@CustomElement({
  tag: 'cts-toast',
  template: `
    <div class="toast" role="status" aria-live="polite" aria-atomic="true">
      <span class="bar" aria-hidden="true"></span>
      <span class="icon" aria-hidden="true">
        <svg class="icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <svg class="icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </span>
      <div class="body">
        <strong class="title"></strong>
        <span class="msg"></span>
      </div>
    </div>
  `,
  styleUrl: './toast.element.scss',
})
export class ToastElement extends HTMLElement {
  private timer: number | undefined;
  private handler = (e: Event) => this.show((e as CustomEvent<ToastDetail>).detail);

  connectedCallback() {
    document.addEventListener('cts:toast', this.handler);
  }

  disconnectedCallback() {
    document.removeEventListener('cts:toast', this.handler);
    if (this.timer) window.clearTimeout(this.timer);
  }

  show(detail: ToastDetail) {
    if (!detail || !this.shadowRoot) return;
    const root = this.shadowRoot;
    const toast = root.querySelector('.toast') as HTMLElement;
    const titleEl = root.querySelector('.title') as HTMLElement;
    const msgEl = root.querySelector('.msg') as HTMLElement;

    titleEl.textContent = detail.title || '';
    msgEl.textContent = detail.message || '';
    toast.dataset.kind = detail.kind || 'success';

    // Re-trigger the entry transition cleanly
    delete toast.dataset.show;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.dataset.show = '';
      });
    });

    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      delete toast.dataset.show;
    }, 2800);
  }
}
