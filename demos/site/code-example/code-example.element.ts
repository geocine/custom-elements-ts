import { CustomElement } from 'custom-elements-ts';

declare const Prism: {
  highlight(code: string, grammar: unknown): string;
  languages: {
    javascript: unknown;
  };
};

@CustomElement({
  tag: 'cts-code-example',
  template: '<div id="code"></div>',
  styleUrl: './code-example.element.scss',
})
export class CodeExampleElement extends HTMLElement {
  public code: string;

  constructor() {
    super();
    const code = `import { CustomElement, Prop, Listen, Dispatch, DispatchEmitter } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: '<button><slot></slot><span class="msg"></span></button>',
  styleUrl: './message.element.scss'
})
export class MessageElement extends HTMLElement {

  @Prop() message: string;

  @Dispatch('message.click') onClick: DispatchEmitter;

  @Listen('click', 'button')
  handleClick() {
    this.onClick.emit({ detail: { message: this.message } });
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.msg').textContent = this.message;
  }
}

// then, in any HTML — React, Vue, Svelte, plain — it just works:
<cts-message message="npm install custom-elements-ts"></cts-message>`;
    this.code = Prism.highlight(code, Prism.languages.javascript);
  }

  connectedCallback() {
    const code = this.shadowRoot?.querySelector('#code');
    if (code) {
      code.innerHTML = `<pre><code>${this.code}</code></pre>`;
    }
  }
}
