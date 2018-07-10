import { CustomElement } from './custom-element';

@CustomElement({
  templateUrl: './counter-element.html',
  styleUrl: './counter-element.scss'
})
export class CustomCounter extends HTMLElement {

  static get observedAttributes() {
    return ['count'];
  }

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