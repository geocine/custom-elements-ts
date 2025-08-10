import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomElement, Dispatch, DispatchEmitter, Listen } from 'custom-elements-ts';
@CustomElement({
  tag: 'btn-dispatch',
  template: `<button>Test</button>`,
})
class DispatchElement extends HTMLElement {
  @Dispatch() btnClick!: DispatchEmitter;
  @Dispatch('btn.namedClick') btnClickNamed!: DispatchEmitter;

  constructor() {
    super();
  }

  @Listen('click')
  btnHandler() {
    this.shadowRoot!.querySelector('button')!.innerHTML = 'Hello';
    this.btnClick.emit({ detail: 'Hello' });
    this.btnClickNamed.emit({ detail: 'Hello from named click' });
  }
}

describe('dispatch decorators', () => {
  let element: any;

  beforeEach(() => {
    const btnElement = document.createElement('btn-dispatch');
    element = document.body.appendChild(btnElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should trigger a btn.click DispatchEmitter', async () => {
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('btn.click', (e: CustomEvent) => resolve(e));
    });
    element.click();
    const e = await eventPromise;
    expect(e.detail).toBe('Hello');
  });

  it('should trigger a btn.namedClick DispatchEmitter', async () => {
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('btn.namedClick', (e: CustomEvent) => resolve(e));
    });
    element.click();
    const e = await eventPromise;
    expect(e.detail).toBe('Hello from named click');
  });
});
