import { CustomElement } from 'custom-elements-ts';

declare const Prism: {
  highlight(code: string, grammar: unknown): string;
  languages: {
    typescript: unknown;
    javascript: unknown;
  };
};

@CustomElement({
  tag: 'cts-code-example',
  template: '<div id="code"></div>',
  styleUrl: './code-example.element.scss',
})
export class CodeExampleElement extends HTMLElement {
  // Mirrors the real cts-message element rendered in the install card on this
  // page. Keeping these in sync is intentional: the source you see is the
  // source that runs the toast you triggered.
  private readonly source = `import {
  CustomElement,
  Prop,
  Listen,
  Dispatch,
  DispatchEmitter,
} from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: \`
    <div class="row" role="button" tabindex="0">
      <span class="prompt" aria-hidden="true">$</span>
      <code class="cmd"></code>
    </div>
  \`,
  styleUrl: './message.element.scss',
})
export class MessageElement extends HTMLElement {
  @Prop() message!: string;

  // Bubbling, composed CustomEvent — the host page can listen on
  // any ancestor (including <cts-toast>) without piercing shadow DOM.
  @Dispatch('cts:toast') toast!: DispatchEmitter;

  @Listen('click')
  async handleClick() {
    const ok = await this.copy(this.message);
    this.toast.emit({
      bubbles: true,
      composed: true,
      detail: ok
        ? { title: 'Copied to clipboard', message: this.message, kind: 'success' }
        : { title: "Couldn't copy", message: 'Copy manually.', kind: 'error' },
    });
  }

  connectedCallback() {
    this.shadowRoot!.querySelector('.cmd')!.textContent = this.message;
  }

  private async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

// Drop it anywhere — React, Vue, Svelte, plain HTML — it just works:
<cts-message message="npm install custom-elements-ts"></cts-message>`;

  private code = '';

  constructor() {
    super();
    const grammar = Prism.languages.typescript ?? Prism.languages.javascript;
    this.code = Prism.highlight(this.source, grammar);
  }

  connectedCallback() {
    const code = this.shadowRoot?.querySelector('#code');
    if (code) {
      code.innerHTML = `<pre><code>${this.code}</code></pre>`;
    }
  }
}
