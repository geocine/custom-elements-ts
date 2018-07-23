import { CustomElement, Watch, Prop, Listen } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-counter',
  templateUrl: './counter.element.html',
  styleUrl: './counter.element.scss'
})
export class CounterElement extends HTMLElement {

  constructor() {
    super();
  }

  @Prop() count = '';

  connectedCallback() {
    this.showCount();
  }
 
  @Listen('click')
  myClick() {
    const incrementCount = parseInt(this.count) + 1;
    this.count = incrementCount.toString();
  }

  @Watch('count')
  changeCount(value: any) {
    this.count = value.new;
    this.showCount();
  }

  showCount() {
    const count = this.shadowRoot.querySelector('#count');
    if (count) {
      count.innerHTML = this.count;
    }
  }
}