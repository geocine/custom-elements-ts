import { CustomElement, Prop, Watch } from 'custom-elements-ts';

@CustomElement({
  tag: 'prop-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
export class PropElement extends HTMLElement {

  @Prop() name;
}

describe('prop decorator', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('prop-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  it('should reflect as property', () => {
    myElementInstance.setAttribute('name', 'Mario');
    expect(myElementInstance.name).toEqual('Mario');
    myElementInstance.setAttribute('name', 'Luigi');
    expect(myElementInstance.name).toEqual('Luigi');
  });

  it('should reflect as attribute', () => {
    myElementInstance.name = 'Aivan';
    expect(myElementInstance.getAttribute('name')).toEqual('Aivan');
    myElementInstance.name = 'Custom Elements';
    expect(myElementInstance.getAttribute('name')).toEqual('Custom Elements');
  });

  it('should not reflect as attribute', () => {
    myElementInstance.name = {};
    expect(myElementInstance.getAttribute('name')).toBeFalsy();
  });

});