import { CustomElement } from 'custom-elements-ts';
declare var Prism;

@CustomElement({
  tag: 'cts-code-example',
  template:'<div id="code"></div>',
  styleUrl: './code-example.element.scss'
})
export class CodeExampleElement extends HTMLElement {
  public code;
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
      this.shadowRoot.querySelector('#code').innerHTML = `<pre><code>${this.code}</code></pre>`;
  }
}