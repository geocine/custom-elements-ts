import { CustomElement, Toggle, Prop } from 'custom-elements-ts';

@CustomElement({})
export class InitElement extends HTMLElement {

  @Toggle() disabled = true;
  @Prop() color = 'blue';

  constructor(){
    super();
  }

  connectedCallback() {}
}

describe('init state', () => {
  let myElement;

  beforeEach(() => {
    myElement = document.createElement('init-element');
  });

  it('should set attribute based on default prop value on init', () => {
    const element = document.body.appendChild(myElement);
    expect(element.getAttribute('color')).toBe('blue');
  });

  it('should set default prop value on init', () => {
    const element = document.body.appendChild(myElement);
    expect(element.color).toBe('blue');
  });

  it('should set attribute based on default toggle value on init', () => {
    const element = document.body.appendChild(myElement);
    expect(element.disabled).toBe(true);
  });

  it('should set default toggle value on init', () => {
    const element = document.body.appendChild(myElement);
    expect(element.disabled).toBe(true);
  });

  it('should reflect attribute to props on init', () => {
    myElement.setAttribute('color','red');
    const element = document.body.appendChild(myElement);
    expect(element.color).toBe('red');
  });

  it('should reflect has attribute to toggle on init', () => {
    myElement.setAttribute('disabled','');
    const element = document.body.appendChild(myElement);
    expect(element.disabled).toBe(true);
  });

  it('should reflect true attribute to toggle on init', () => {
    myElement.setAttribute('disabled','true');
    const element = document.body.appendChild(myElement);
    expect(element.disabled).toBe(true);
  });

  it('should reflect false attribute to toggle on init', () => {
    myElement.setAttribute('disabled','false');
    const element = document.body.appendChild(myElement);
    expect(element.disabled).toBe(false);
  });

});