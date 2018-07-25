import { CustomElement, Watch, Prop, Dispatch, DispatchEmitter, Listen } from 'custom-elements-ts';

@CustomElement({
  tag: 'my-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
export class MyElement extends HTMLElement {

  @Prop() name = 'my element';

  @Watch('name')
  setSpan(value){
    const span = this.shadowRoot.querySelector('span');
    span.innerHTML = value.new;
  }
}

describe('decorators', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('my-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  it('should load html template', () => {
      expect(myElementInstance.shadowRoot.innerHTML).toContain('<span>my element</span>');
  });

  it('should load css', () => {
    expect(myElementInstance.shadowRoot.querySelector('style').innerText).toContain(':host{border:0}');
  });

  it('should re-render setting property', () => {
    myElementInstance.name = 'Aivan';
    expect(myElementInstance.shadowRoot.querySelector('span').innerHTML).toEqual('Aivan');
  });

  it('should call method decorated with @Watch on prop change', () => {
    const watchSpy = spyOn(myElementInstance,'setSpan');
    myElementInstance.name = 'Aivan';
    expect(watchSpy).toHaveBeenCalled();
  });

  it('should call method decorated with @Watch on prop change', () => {
    const watchSpy = spyOn(myElementInstance,'setSpan');
    myElementInstance.setAttribute('name', 'Mario');
    expect(watchSpy).toHaveBeenCalledWith(...[{ old: null, new: 'Mario'}]);
    expect(myElementInstance.name).toEqual('Mario');
  });

  it('should reflect as property', () => {
    myElementInstance.setAttribute('name', 'Mario');
    expect(myElementInstance.name).toEqual('Mario');
  });

  it('should reflect as dom attribute', () => {
    myElementInstance.name = 'Aivan';
    expect(myElementInstance.getAttribute('name')).toEqual('Aivan');
  });

  it('should not reflect as dom attribute', () => {
    myElementInstance.name = {};
    expect(myElementInstance.getAttribute('name')).toBeFalsy();
  });

  it('should have shadowroot', () => {
    expect(myElementInstance.shadowRoot).toBeTruthy();
  });
});


@CustomElement({})
export class BasicElement extends HTMLElement {

  @Prop() disabled;

  constructor(){
    super();
  }

  connectedCallback() {}
}

describe('decorators basic', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('basic-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  it('should have shadowroot', () => {
    expect(myElementInstance.shadowRoot).toBeTruthy();
  });

  it('should return false on no attribute set', () => {
    expect(myElementInstance.disabled).toBe(false);
  });

  it('should return true on empty attribute set', () => {
    myElementInstance.setAttribute('disabled','');
    expect(myElementInstance.disabled).toBe(true);
  });

  it('should return value on attribute set', () => {
    myElementInstance.setAttribute('disabled','true');
    expect(myElementInstance.disabled).toBe('true');
  });

});

@CustomElement({
  tag: 'btn-listen-dispatch',
  template: `<button>Test</button>`
})
export class ButtonElement extends HTMLElement {

  @Dispatch() btnClick: DispatchEmitter;
  @Dispatch('btn.namedClick') btnClickNamed: DispatchEmitter;

  constructor() {
    super();
  }

  @Listen('click')
  btnHandler(){
    this.shadowRoot.querySelector('button').innerHTML = 'Hello';
    this.btnClick.emit({detail: 'Hello'});
    this.btnClickNamed.emit({detail: 'Hello from named click'});
  }

  @Listen('click', 'button')
  btnInnerClick() {}

}

describe('event listen', () => {
  let element: any;

  beforeEach(() => {
    const btnElement = document.createElement('btn-listen-dispatch');
    element = document.body.appendChild(btnElement);
  });

  it('should call method decorated @Listen', () => {
    const btnHandlerSpsy = spyOn(element.btnHandler,'call');
    element.click();
    expect(btnHandlerSpsy).toHaveBeenCalled();
  });

  it('should trigger a btn.click DispatchEmitter', (done) => {
    element.addEventListener('btn.click', (e) => {
      expect(e.detail).toBe('Hello');
      done();
    });
    element.click();
  });

  it('should trigger a btn.namedClick DispatchEmitter', (done) => {
    element.addEventListener('btn.namedClick', (e) => {
      expect(e.detail).toBe('Hello from named click');
      done();
    });
    element.click();
  });


  it('should call method decorated @Listen on children element click', () => {
    const btnHandlerSpsy = spyOn(element.btnHandler,'call');
    element.shadowRoot.querySelector('button').click();
    expect(btnHandlerSpsy).toHaveBeenCalled();
  });

  it('should call method decorated @Listen on selector click', () => {
    const btnInnerSpsy = spyOn(element.btnInnerClick,'call');
    element.shadowRoot.querySelector('button').click();
    expect(btnInnerSpsy).toHaveBeenCalled();
  });

  it('should execute inner method decorated @Listen', () => {
    element.click();
    expect(element.shadowRoot.querySelector('button').innerHTML).toEqual('Hello');
  });

});