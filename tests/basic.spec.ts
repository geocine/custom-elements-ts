import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'basic-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
class BasicElement extends HTMLElement {}

describe('basic test', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('basic-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should load html template', () => {
      expect(myElementInstance.shadowRoot.innerHTML).toContain('<span>my element</span>');
  });

  it('should load css', () => {
    expect(myElementInstance.shadowRoot.querySelector('style').innerText).toContain(':host{border:0}');
  });

  it('should have shadowroot', () => {
    expect(myElementInstance.shadowRoot).toBeTruthy();
  });

});


@CustomElement({
  tag: 'shadow-false-element',
  template: '<span>my element</span>',
  style: ':host{border:0}',
  shadow: false
})
class ShadowFalseElement extends HTMLElement {}

describe('basic test no shadowroot', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('shadow-false-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should load html template', () => {
      expect(myElementInstance.innerHTML).toContain('<span>my element</span>');
  });

  it('should have css', () => {
    expect(myElementInstance.querySelector('style')).toBeTruthy();
  });

  it('shadow not have a shadowroot', () => {
    expect(myElementInstance.shadowRoot).toBeFalsy();
  });
});