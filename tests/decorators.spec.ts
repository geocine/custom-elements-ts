import { CustomElement, Watch, Prop } from 'custom-elements-ts';

@CustomElement({
  tag: 'my-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
export class MyElement extends HTMLElement {

  @Prop() name;

  @Watch('name')
  setSpan(_: string, newValue: string){
    const span = this.shadowRoot.querySelector('span');
    span.innerHTML = newValue;
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
    expect(myElementInstance.shadowRoot.innerHTML).toContain('<style>:host{border:0}</style>');
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

  xit('should call connected callback', () => {
    const connectedCallbackSpy = spyOn(myElementInstance,'connectedCallback');
    expect(connectedCallbackSpy).toHaveBeenCalled();
  });
});