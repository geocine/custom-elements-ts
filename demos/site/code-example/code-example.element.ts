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
    const code = `
// Typescript
import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: '<h1></h1>'
  style: '' // css styles here or can use styleUrl
})
export class MessageElement extends HTMLElement {

  constructor() {
    super();
    this.addEventListener('click', () => {
      alert('what are you waiting for?');
    });
  }

  get message() {
    return this.getAttribute('message');
  }

  set message(value) {
    this.setAttribute('message', value);
  }

  connectedCallback(){
    this.shadowRoot.querySelector('h1').innerHTML = this.message;
  }
}

// HTML
<cts-message message="npm install custom-elements-ts"></cts-message>
        `;
      this.code = Prism.highlight(code, Prism.languages.javascript);
  }

  connectedCallback() {
      this.shadowRoot.querySelector('#code').innerHTML = `<pre><code>${this.code}</code></pre>`;
  }
}