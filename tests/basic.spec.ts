import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'basic-element',
  template: '<span>my element</span>',
  style: ':host{border:0}'
})
export class BasicElement extends HTMLElement {}

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