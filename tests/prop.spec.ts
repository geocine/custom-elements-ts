import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomElement, Prop } from 'custom-elements-ts';

@CustomElement({
  tag: 'prop-element',
  template: '<span>my element</span>',
  style: ':host{border:0}',
})
class PropElement extends HTMLElement {
  @Prop() name: any;
  @Prop() maxFileSize: any;

  @Prop() objectProp: any;
  @Prop() init = 'blue';

  @Prop() kebabCase = 'kebab';

  @Prop() fnProp: any;
  @Prop() classProp: any;
}

describe('prop decorator', () => {
  let myElementInstance: any;

  beforeEach(() => {
    const myElement = document.createElement('prop-element');
    myElementInstance = document.body.appendChild(myElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should reflect as property', () => {
    myElementInstance.setAttribute('name', 'Mario');
    expect(myElementInstance.getAttribute('name')).toEqual('Mario');
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

  it('should properly set camelcase properties', () => {
    myElementInstance.maxFileSize = 1;
    expect(myElementInstance.maxFileSize).toEqual(1);
  });

  it('should properly get camelcase properties as kebabcase attributes', () => {
    myElementInstance.maxFileSize = 1;
    expect(myElementInstance.getAttribute('max-file-size')).toEqual('1');
  });

  it('should properly set kebabcase attributes as camelcase properties', () => {
    myElementInstance.setAttribute('max-file-size', 2);
    expect(myElementInstance.maxFileSize).toEqual(2);
  });

  it('should evaluate property', () => {
    myElementInstance.objectProp = { name: 'Name' };
    expect(myElementInstance.objectProp.name).toEqual('Name');
  });

  it('should change attribute on attribute change', () => {
    myElementInstance.setAttribute('init', 'red');
    expect(myElementInstance.init).toEqual('red');
    expect(myElementInstance.getAttribute('init')).toEqual('red');
  });

  it('should change property via kebab attribute', () => {
    myElementInstance.setAttribute('kebab-case', 'shawarma');
    expect(myElementInstance.kebabCase).toEqual('shawarma');
  });

  it('should not reflect function values as attributes and preserve reference', () => {
    const fn = () => 42;
    myElementInstance.fnProp = fn;
    expect(myElementInstance.getAttribute('fn-prop')).toBeFalsy();
    expect(typeof myElementInstance.fnProp).toEqual('function');
    expect(myElementInstance.fnProp()).toEqual(42);
  });

  it('should not reflect class/constructor values as attributes and preserve reference', () => {
    class Foo {}
    myElementInstance.classProp = Foo;
    expect(myElementInstance.getAttribute('class-prop')).toBeFalsy();
    expect(myElementInstance.classProp).toBe(Foo);
  });
});
