import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: '<h1></h1>',
  style: `
    :host {
      margin: 0 auto;
      margin-top: 50px;
      display: block;
      width: calc(100% - 50px);
      text-align: center;
      cursor: pointer;
    }
    h1 {
      font-size: 14px;
      margin: 0 auto;
      padding: 20px;
      background: #2e8edf;
      color: whitesmoke;
      border-radius: 3px;
    }
  `
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