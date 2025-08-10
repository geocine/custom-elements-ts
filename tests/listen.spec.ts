import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CustomElement, Dispatch, DispatchEmitter, Listen } from 'custom-elements-ts';

@CustomElement({
  tag: 'btn-listen-dispatch',
  template: `<button>Test</button>`,
})
class ButtonElement extends HTMLElement {
  @Dispatch() btnClick!: DispatchEmitter;
  @Dispatch('btn.namedClick') btnClickNamed!: DispatchEmitter;

  constructor() {
    super();
  }

  @Listen('click')
  btnHandler() {
    this.shadowRoot!.querySelector('button')!.innerHTML = 'Hello';
  }

  @Listen('click', 'button')
  btnInnerClick() {}
}

describe('listen decorator', () => {
  let element: any;

  beforeEach(() => {
    const btnElement = document.createElement('btn-listen-dispatch');
    element = document.body.appendChild(btnElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should call method decorated @Listen', () => {
    const btnHandlerSpy = vi.spyOn(element.btnHandler, 'call');
    element.click();
    expect(btnHandlerSpy).toHaveBeenCalled();
  });

  it('should call method decorated @Listen on children element click', () => {
    const btnHandlerSpy = vi.spyOn(element.btnHandler, 'call');
    element.shadowRoot.querySelector('button').click();
    expect(btnHandlerSpy).toHaveBeenCalled();
  });

  it('should call method decorated @Listen on selector click', () => {
    const btnInnerSpy = vi.spyOn(element.btnInnerClick, 'call');
    element.shadowRoot.querySelector('button').click();
    expect(btnInnerSpy).toHaveBeenCalled();
  });

  it('should execute inner method decorated @Listen', () => {
    element.click();
    expect(element.shadowRoot.querySelector('button').innerHTML).toEqual('Hello');
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
@CustomElement({
  tag: 'btn-listen-shadow-false',
  template: `<button>Test</button>`,
  shadow: false,
})
class ShadowFalseButtonElement extends HTMLElement {
  @Dispatch() btnClick!: DispatchEmitter;
  @Dispatch('btn.namedClick') btnClickNamed!: DispatchEmitter;

  constructor() {
    super();
  }

  @Listen('click')
  btnHandler() {
    this.querySelector('button')!.innerHTML = 'Hello';
  }

  @Listen('click', 'button')
  btnInnerClick() {}
}

describe('listen decorator no shadowroot', () => {
  let element: any;

  beforeEach(() => {
    const btnElement = document.createElement('btn-listen-shadow-false');
    element = document.body.appendChild(btnElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should call method decorated @Listen', () => {
    const btnHandlerSpy = vi.spyOn(element.btnHandler, 'call');
    element.click();
    expect(btnHandlerSpy).toHaveBeenCalled();
  });

  it('should call method decorated @Listen on children element click', () => {
    const btnHandlerSpy = vi.spyOn(element.btnHandler, 'call');
    element.querySelector('button').click();
    expect(btnHandlerSpy).toHaveBeenCalled();
  });

  it('should call method decorated @Listen on selector click', () => {
    const btnInnerSpy = vi.spyOn(element.btnInnerClick, 'call');
    element.querySelector('button').click();
    expect(btnInnerSpy).toHaveBeenCalled();
  });

  it('should execute inner method decorated @Listen', () => {
    element.click();
    expect(element.querySelector('button').innerHTML).toEqual('Hello');
  });
});
