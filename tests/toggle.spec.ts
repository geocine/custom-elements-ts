import { CustomElement, Toggle, Watch } from 'custom-elements-ts';

@CustomElement({})
export class ToggleElement extends HTMLElement {

  @Toggle() disabled;

}

describe('toggle decorator', () => {
  let myElementInstance;

  beforeEach(() => {
    const myElement = document.createElement('toggle-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should return false on no attribute set', () => {
    expect(myElementInstance.disabled).toBe(false);
  });

  it('should return true on empty attribute set', () => {
    myElementInstance.setAttribute('disabled','');
    expect(myElementInstance.disabled).toBe(true);
  });

  it('should return false on remove attribute', () => {
    myElementInstance.removeAttribute('disabled');
    expect(myElementInstance.disabled).toBe(false);
  });

  it('should return value on attribute set', () => {
    myElementInstance.setAttribute('disabled','true');
    expect(myElementInstance.disabled).toBe(true);
    myElementInstance.setAttribute('disabled','false');
    expect(myElementInstance.disabled).toBe(false);
  });

  it('should return false on random string attribute set', () => {
    let warn = console.warn;
    // suppressing warn
    console.warn = () => {};
    myElementInstance.setAttribute('disabled','asd');
    expect(myElementInstance.disabled).toBe(false);
    console.warn = warn;
  });

  it('should add attribute on empty prop set', () => {
    myElementInstance.disabled = '';
    expect(myElementInstance.hasAttribute('disabled')).toBe(true);
  });

  it('should remove attribute on null prop set', () => {
    myElementInstance.disabled = null;
    expect(myElementInstance.hasAttribute('disabled')).toBe(false);
  });

  it('should reflect prop to attribute', () => {
    myElementInstance.disabled = true;
    expect(myElementInstance.getAttribute('disabled')).toBe('true');
    myElementInstance.disabled = false;
    expect(myElementInstance.getAttribute('disabled')).toBe('false');
  });

  it('should reflect random string prop to attribute as false', () => {
    const warn = console.warn;
    console.warn = () => {};
    myElementInstance.disabled = 'asd';
    expect(myElementInstance.getAttribute('disabled')).toBe('false');
    console.warn = warn;
  });

});