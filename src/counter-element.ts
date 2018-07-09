import { CustomElement } from './custom-element';

@CustomElement({
  template: `
    <button id="count"></button>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    :host button {
      width: 50px;
      height: 50px;
      color: #FFF;
      background-color: #000;
      border: 0;
      border-radius: 5px;
      font-size: 20px;
      outline: none;
      cursor: pointer;
    }
  `
})
export class CounterElement extends HTMLElement {


  static get observedAttributes() {
    return ['count'];
  }

  /**
   *
   */
  constructor() {
    super();
    this.addEventListener('click', () => {
      const incrementCount = parseInt(this.count)+1;
      this.changeCount(incrementCount.toString());
    });
  }

  get count() {
    return this.getAttribute('count') ? this.getAttribute('count') : '0';
  }

  set count(value: string) {
    this.setAttribute('count', value);
  }

  connectedCallback() {
    this.showCount();
  }

  disconnectedCallback() {}

  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (name == 'count' && oldValue != newValue) {
      this.changeCount(newValue);
    }
  }

  changeCount(count: string) {
    this.count = count;
    this.showCount();
  }

  showCount() {
    const count = this.shadowRoot!.querySelector('#count');
    if (count) {
      count.innerHTML = this.count;
    }
  }
}