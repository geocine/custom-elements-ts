import {
  CustomElement,
  Prop,
  Listen,
  Dispatch,
  DispatchEmitter,
} from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: `
    <div class="row" role="button" tabindex="0" aria-label="Copy install command to clipboard">
      <span class="prompt" aria-hidden="true">$</span>
      <code class="cmd"></code>
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="1"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </span>
    </div>
  `,
  styleUrl: './message.element.scss',
})
export class MessageElement extends HTMLElement {
  @Prop() message: string;

  @Dispatch('cts:toast') toast: DispatchEmitter;

  @Listen('click')
  async handleClick() {
    const text = this.message ?? '';
    let ok = true;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        ok = this.fallbackCopy(text);
      }
    } catch {
      ok = false;
    }
    this.toast.emit({
      bubbles: true,
      composed: true,
      detail: ok
        ? { title: 'Copied to clipboard', message: text, kind: 'success' }
        : { title: "Couldn't copy", message: 'Copy the command manually.', kind: 'error' },
    });
  }

  @Listen('keydown')
  handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick();
    }
  }

  connectedCallback() {
    const cmd = this.shadowRoot?.querySelector('.cmd');
    if (cmd) cmd.textContent = this.message;
  }

  // Older browsers / non-secure contexts: fall back to the legacy copy path.
  private fallbackCopy(text: string): boolean {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}
