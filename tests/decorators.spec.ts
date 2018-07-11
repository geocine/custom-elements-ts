import { CustomElement, Watch } from 'custom-elements-ts';

@CustomElement({
  tag: 'my-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
export class MyElement extends HTMLElement {

  get name(){
    return this.getAttribute('name');
  }

  set name(value){
    this.setAttribute('name',value);
  }

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

  it('should call method decorated with @Watch', () => {
    const watchSpy = spyOn(myElementInstance,'setSpan');
    myElementInstance.name = 'Aivan';
    expect(watchSpy).toHaveBeenCalled();
  });


  it('should reflect as dom attribute', () => {
    myElementInstance.name = 'Aivan';
    expect(myElementInstance.getAttribute('name')).toEqual('Aivan');
  });

  it('should have shadowroot', () => {
    expect(myElementInstance.shadowRoot).toBeTruthy();
  });
});
