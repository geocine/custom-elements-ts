import { CustomElement, Watch, Prop } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-counter',
  templateUrl: './counter.element.html',
  styleUrl: './counter.element.scss'
})
export class CounterElement extends HTMLElement {

  constructor() {
    super();
    this.addEventListener('click', () => {
      const incrementCount = parseInt(this.count)+1;
      this.count = incrementCount.toString();
    });
  }

  @Prop() count = '';

  connectedCallback() {
    this.showCount();
  }

  @Watch('count')
  changeCount(_: string, newCount: string) {
    this.count = newCount;
    this.showCount();
  }

  showCount() {
    const count = this.shadowRoot.querySelector('#count');
    if (count) {
      count.innerHTML = this.count;
    }
  }
}