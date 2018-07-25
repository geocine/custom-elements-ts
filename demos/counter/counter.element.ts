import { CustomElement, Watch, Prop, Listen, Dispatch, DispatchEmitter } from 'custom-elements-ts';

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
  @Dispatch() ctsClick: DispatchEmitter;

  connectedCallback() {
    this.showCount();
  }
 
  @Listen('click')
  incrementHandler() {
    this.ctsClick.emit({
      detail: { count: parseInt(this.count) + 1 }
    })
  }

  @Listen('cts.click')
  countIncrement(e: CustomEvent){
    this.count = e.detail.count;
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