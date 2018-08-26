import { CustomElement, Prop, Watch } from 'custom-elements-ts';

@CustomElement({
  tag: 'watch-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
export class WatchElement extends HTMLElement {

  @Prop() name;

  @Watch('name')
  setSpan(value){
    const span = this.shadowRoot.querySelector('span');
    span.innerHTML = value.new;
  }

  set label(value: any) {
    this.setAttribute('label', value);
  }
  get label(): any {
    return this.getAttribute('label') || '';
  }

  newLabel = '';
  @Watch('label')
  setLabel(value) {
    this.newLabel = value.new;
  }


  newColor = '';
  @Prop() color = 'blue';
  @Watch('color')
  changeColor() {
    this.newColor = this.color;
  }

  newCase = '';
  @Prop() setCase;
  @Watch('setCase')
  changeCase() {
    this.newCase = this.setCase;
  }

  @Watch('set-kebab')
  changeKebabCase() {
    this.newCase = this.setCase;
  }
}

describe('watch decorator', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('watch-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
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

  it('should call @Watch on attribute change with new property value', () => {
    myElementInstance.setAttribute('color', 'red');
    expect(myElementInstance.newColor).toEqual('red');
  });

  it('should call @Watch for plain get/set with correct value.new', () => {
    myElementInstance.setAttribute('label', 'Name');
    expect(myElementInstance.newLabel).toEqual('Name');
  });

  it('should call non kebab @Watch on kebab attribute change with new property value', () => {
    myElementInstance.setAttribute('set-case', 'kebab');
    expect(myElementInstance.newCase).toEqual('kebab');
  });

  it('should call kebab @Watch on kebab attribute change with new property value', () => {
    myElementInstance.setAttribute('set-case', 'snake');
    expect(myElementInstance.newCase).toEqual('snake');
  });
});