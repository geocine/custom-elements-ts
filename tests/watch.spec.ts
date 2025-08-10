import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CustomElement, Prop, Toggle, Watch } from 'custom-elements-ts';

@CustomElement({
  tag: 'watch-element',
  template: '<span>my element</span>',
  style: ':host{border:0}',
})
class WatchElement extends HTMLElement {
  @Prop() name: any;

  @Watch('name')
  setSpan(value: any) {
    const span = this.shadowRoot!.querySelector('span');
    span!.innerHTML = value.new;
  }

  set label(value: any) {
    this.setAttribute('label', value);
  }
  get label(): any {
    return this.getAttribute('label') || '';
  }

  newLabel = '';
  @Watch('label')
  setLabel(value: any) {
    this.newLabel = value.new;
  }

  newColor = '';
  @Prop() color = 'blue';
  @Watch('color')
  changeColor() {
    this.newColor = this.color;
  }

  caseChanged = false;
  @Prop() setCase: any;
  @Watch('setCase')
  changeCase(value: any) {
    this.caseChanged = this.setCase === value.new;
  }

  @Watch('set-kebab')
  changeKebabCase(value: any) {
    this.caseChanged = this.setCase === value.new;
  }

  menuChanged = false;
  @Prop() menus = 'a';
  @Watch('menus')
  changeMenus(value: any) {
    this.menuChanged = this.menus === value.new;
  }

  enabledChanged = false;
  @Toggle() enabled: any;
  @Watch('enabled')
  changeEnable(value: any) {
    this.enabledChanged = this.enabled.toString() === value.new;
  }
}

describe('watch decorator', () => {
  let myElementInstance: any;

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
    const watchSpy = vi.spyOn(myElementInstance, 'setSpan');
    myElementInstance.name = 'Aivan';
    expect(watchSpy).toHaveBeenCalled();
  });

  it('should call method decorated with @Watch on prop change', () => {
    const watchSpy = vi.spyOn(myElementInstance, 'setSpan');
    myElementInstance.setAttribute('name', 'Mario');
    expect(watchSpy).toHaveBeenCalledWith(...[{ old: null, new: 'Mario' }]);
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
    expect(myElementInstance.setCase).toEqual('kebab');
    expect(myElementInstance.caseChanged).toBeTruthy();
  });

  it('should call kebab @Watch on kebab attribute change with new property value', () => {
    myElementInstance.setAttribute('set-case', 'snake');
    expect(myElementInstance.setCase).toEqual('snake');
    expect(myElementInstance.caseChanged).toBeTruthy();
  });

  it('should call @Watch on property change with new property value', () => {
    const menus = [
      {
        text: 'Colors',
        link: '/user-interface/style-guides/colors',
      },
      {
        text: 'Logo',
        link: '/user-interface/style-guides/logo',
      },
    ];
    myElementInstance.menus = menus;
    expect(myElementInstance.menus).toEqual(menus);
    expect(myElementInstance.menuChanged).toBeTruthy();
  });

  it('should call @Watch on toggle attribute with new property value', () => {
    myElementInstance.enabled = true;
    expect(myElementInstance.enabledChanged).toBeTruthy();
  });
});
