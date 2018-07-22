import { CustomElement, Watch, Prop } from 'custom-elements-ts';

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