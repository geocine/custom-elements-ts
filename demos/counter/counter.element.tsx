import { CustomElement, Watch, Prop, Listen, Dispatch, DispatchEmitter, h } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-counter',
  styleUrl: './counter.element.scss'
})
export class CounterElement extends HTMLElement {

  constructor() {
    super();
  }

  @Prop() count = '';
  @Dispatch() ctsClick: DispatchEmitter;

  render() {
    return (
      <button id='count' onClick={() => this.incrementHandler()}>{this.count}</button>
    );
  }

  incrementHandler() {
    const count = parseInt(this.count) + 1;
    this.count = count as any;
    this.ctsClick.emit({ detail: { count } });
  }
}