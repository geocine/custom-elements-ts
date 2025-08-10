import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'ce-a',
  template: '<div id="t">X</div>',
  style: ':host{display:block}',
  shadow: true,
})
class A extends HTMLElement {
  _watchArgs: any = undefined;
  watched(args: any) {
    this._watchArgs = args;
  }
}

@CustomElement({
  tag: 'ce-b',
  template: '<span id="light">L</span>',
  shadow: false,
})
class B extends HTMLElement {}

describe('CustomElement decorator', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders template and style into shadowRoot by default', () => {
    const el = document.createElement('ce-a') as A;
    document.body.appendChild(el);
    expect(el.shadowRoot).toBeTruthy();
    expect(el.shadowRoot!.querySelector('#t')!.textContent).toBe('X');
  });

  it('renders into light DOM when shadow=false', () => {
    const el = document.createElement('ce-b') as B;
    document.body.appendChild(el);
    expect(el.shadowRoot).toBeNull();
    expect(el.querySelector('#light')!.textContent).toBe('L');
  });

  it('observedAttributes are derived from propsInit and kebab-cased', () => {
    (A as any).propsInit = { myAttr: null, anotherAttr: null };
    const observed = (A as any).observedAttributes as string[];
    expect(observed).toContain('my-attr');
    expect(observed).toContain('another-attr');
  });

  it('attributeChangedCallback delegates to onAttributeChange and sets camelCase prop', () => {
    (A as any).propsInit = { fooBar: null };
    const el = document.createElement('ce-a') as A;
    const spy = vi.spyOn(el as any, 'onAttributeChange');
    document.body.appendChild(el);
    // Simulate platform callback directly since observedAttributes may be empty at define time
    (el as any).attributeChangedCallback('foo-bar', null as any, 'v1');
    expect(spy).toHaveBeenCalled();
    // property should be set via camelCase mapping
    expect((el as any).fooBar).toBe('v1');
  });

  it('onAttributeChange triggers watch method only when connected', () => {
    (A as any).watchAttributes = { 'my-attr': 'watched' };
    (A as any).propsInit = { myAttr: null };
    const el = document.createElement('ce-a') as A;
    // not connected: should not call watched
    (el as any).onAttributeChange('my-attr', null as any, 'x');
    expect(el._watchArgs).toBeUndefined();

    // connected: should call watched
    document.body.appendChild(el);
    el._watchArgs = undefined;
    // Simulate platform callback directly to trigger watcher
    (el as any).onAttributeChange('my-attr', null as any, 'y');
    expect(el._watchArgs).toEqual({ old: null, new: 'y' });
  });
});

