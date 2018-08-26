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

});