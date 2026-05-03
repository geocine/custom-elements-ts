import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  CustomElement,
  Prop,
  State,
  TemplateResult,
  TemplateValue,
  Toggle,
  Watch,
  html,
} from 'custom-elements-ts';
import { isStateName } from '../src/state';
import { RenderState, renderIntoAnchor } from '../src/template-runtime';

const nextMicrotask = () => Promise.resolve();

@CustomElement({
  tag: 'render-static-element',
  style: ':host{display:block}',
})
class RenderStaticElement extends HTMLElement {
  connectedSawRendered = false;

  render(): TemplateResult {
    return html`<span id="message">Hello</span>`;
  }

  connectedCallback() {
    this.connectedSawRendered = Boolean(this.shadowRoot!.querySelector('#message'));
  }
}

@CustomElement({
  tag: 'render-light-element',
  shadow: false,
})
class RenderLightElement extends HTMLElement {
  render(): TemplateResult {
    return html`<span id="light">Light</span>`;
  }
}

@CustomElement({
  tag: 'render-dynamic-element',
})
class RenderDynamicElement extends HTMLElement {
  @Prop() label = 'Alpha';
  @Prop() title = 'Ready';
  @State() enabled = true;
  @Prop() value = 'one';
  @Prop() items = [{ label: 'First' }];

  render(): TemplateResult {
    return html`
      <p id="label">${this.label}</p>
      <p id="fn">${() => this.label}</p>
      <div id="attr" title=${this.title} data-enabled=${this.enabled}></div>
      <input id="field" .value=${this.value} />
      <ul id="list">
        ${this.items.map((item: { label: string }) => html`<li>${item.label}</li>`)}
      </ul>
    `;
  }
}

@CustomElement({
  tag: 'render-event-element',
})
class RenderEventElement extends HTMLElement {
  @State() alternate = false;
  primary = vi.fn();
  secondary = vi.fn();

  render(): TemplateResult {
    return html`<button id="action" @click=${this.alternate ? this.secondary : this.primary}>
      Action
    </button>`;
  }
}

@CustomElement({
  tag: 'render-stable-event-element',
})
class RenderStableEventElement extends HTMLElement {
  @State() count = 0;
  clicks = 0;

  render(): TemplateResult {
    return html`
      <button id="stable" @click=${this.handleClick}>Stable</button>
      <span id="stable-count">${this.count}</span>
    `;
  }

  handleClick() {
    this.clicks++;
  }
}

@CustomElement({
  tag: 'render-shape-element',
})
class RenderShapeElement extends HTMLElement {
  @State() detail = false;

  render(): TemplateResult {
    return this.detail
      ? html`<strong id="detail">Detail</strong>`
      : html`<span id="summary">Summary</span>`;
  }
}

@CustomElement({
  tag: 'render-reactive-element',
})
class RenderReactiveElement extends HTMLElement {
  renderCount = 0;
  watched: any[] = [];

  @Prop() label = 'prop';
  @Toggle() active = false;
  @State() count = 0;
  @State() user = { name: 'Ada' };
  @State() items = [{ label: 'One' }];
  @State() created = new Date('2026-01-01T00:00:00Z');

  @Watch('count')
  watchCount(value: any) {
    this.watched.push(value);
  }

  render(): TemplateResult {
    this.renderCount++;
    return html`
      <span id="label">${this.label}</span>
      <span id="active">${this.active}</span>
      <span id="count">${this.count}</span>
      <span id="name">${this.user.name}</span>
      <span id="first">${this.items[0]?.label}</span>
      <span id="size">${this.items.length}</span>
    `;
  }
}

@CustomElement({
  tag: 'render-lifecycle-edge-element',
})
class RenderLifecycleEdgeElement extends HTMLElement {
  connectedCalls = 0;
  disconnectedCalls = 0;
  renderCount = 0;

  @State() label = 'one';

  connectedCallback() {
    this.connectedCalls++;
  }

  disconnectedCallback() {
    this.disconnectedCalls++;
  }

  render(): TemplateResult {
    this.renderCount++;
    if (this.label === 'throw') {
      throw new Error('render failed');
    }
    return html`<span id="edge">${this.label}</span>`;
  }
}

@CustomElement({
  tag: 'render-static-only-edge',
  template: '<span id="static-only">Static only</span>',
  style: ':host{display:block}',
})
class RenderStaticOnlyEdge extends HTMLElement {}

@CustomElement({
  tag: 'render-primitive-edge',
})
class RenderPrimitiveEdge extends HTMLElement {
  @State() text = 'plain render';

  render(): TemplateValue {
    return this.text;
  }
}

@CustomElement({
  tag: 'render-light-style-edge',
  shadow: false,
  style: '.light-edge{color:red}',
})
class RenderLightStyleEdge extends HTMLElement {
  render(): TemplateResult {
    return html`<span class="light-edge">Light styled</span>`;
  }
}

@CustomElement({
  tag: 'prop-watch-attr-edge',
})
class PropWatchAttrEdge extends HTMLElement {
  seen: any;

  @Prop() tracked: any;

  @Watch('tracked')
  onTracked(value: any) {
    this.seen = value;
  }
}

@CustomElement({
  tag: 'state-edge-element',
})
class StateEdgeElement extends HTMLElement {
  renderCount = 0;

  @State() maybe: any;
  @State() model = { user: { name: 'Ada' }, count: 1 };
  @State() spanState = document.createElement('span');
  @State() mapValue = new Map<string, string>();

  render(): TemplateResult {
    this.renderCount++;
    return html`
      <span id="maybe">${String(this.maybe)}</span>
      <span id="name">${this.model.user?.name ?? 'missing'}</span>
      <span id="count">${this.model.count ?? 'missing'}</span>
      <span id="node">${this.spanState.tagName}</span>
      <span id="map">${this.mapValue.size}</span>
    `;
  }
}

describe('runtime templating and render lifecycle', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts static render output with style before rendered content', () => {
    const element = document.body.appendChild(
      document.createElement('render-static-element')
    ) as RenderStaticElement;

    expect(element.shadowRoot!.querySelector('style')!.textContent).toBe(':host{display:block}');
    expect(element.shadowRoot!.querySelector('#message')!.textContent).toBe('Hello');
    expect(element.connectedSawRendered).toBe(true);
    expect(element.shadowRoot!.firstElementChild!.tagName).toBe('STYLE');
  });

  it('renders into the host when shadow=false', () => {
    const element = document.body.appendChild(document.createElement('render-light-element'));

    expect(element.shadowRoot).toBeNull();
    expect(element.querySelector('#light')!.textContent).toBe('Light');
  });

  it('updates child, function child, attribute, property, nested template, and array parts', async () => {
    const element = document.body.appendChild(
      document.createElement('render-dynamic-element')
    ) as any;

    expect(element.shadowRoot.querySelector('#label').textContent).toBe('Alpha');
    expect(element.shadowRoot.querySelector('#fn').textContent).toBe('Alpha');
    expect(element.shadowRoot.querySelector('#attr').getAttribute('title')).toBe('Ready');
    expect(element.shadowRoot.querySelector('#field').value).toBe('one');
    expect(
      Array.from(element.shadowRoot.querySelectorAll('li')).map((node: any) => node.textContent)
    ).toEqual(['First']);

    const labelText = element.shadowRoot.querySelector('#label').firstChild;
    const fnText = element.shadowRoot.querySelector('#fn').firstChild;
    const firstLi = element.shadowRoot.querySelector('li');

    element.label = 'Beta';
    element.items = [{ label: 'Second' }];
    await nextMicrotask();

    expect(element.shadowRoot.querySelector('#label').firstChild).toBe(labelText);
    expect(element.shadowRoot.querySelector('#fn').firstChild).toBe(fnText);
    expect(element.shadowRoot.querySelector('li')).toBe(firstLi);
    expect(element.shadowRoot.querySelector('#label').textContent).toBe('Beta');
    expect(element.shadowRoot.querySelector('#fn').textContent).toBe('Beta');
    expect(element.shadowRoot.querySelector('li').textContent).toBe('Second');

    element.title = null;
    element.enabled = false;
    element.value = 'two';
    element.items = [{ label: 'Second' }, { label: 'Third' }];
    await nextMicrotask();

    expect(element.shadowRoot.querySelector('#label').textContent).toBe('Beta');
    expect(element.shadowRoot.querySelector('#fn').textContent).toBe('Beta');
    expect(element.shadowRoot.querySelector('#attr').hasAttribute('title')).toBe(false);
    expect(element.shadowRoot.querySelector('#attr').hasAttribute('data-enabled')).toBe(false);
    expect(element.shadowRoot.querySelector('#field').value).toBe('two');
    expect(
      Array.from(element.shadowRoot.querySelectorAll('li')).map((node: any) => node.textContent)
    ).toEqual(['Second', 'Third']);
  });

  it('updates template event handlers and removes them on dispose', async () => {
    const element = document.body.appendChild(
      document.createElement('render-event-element')
    ) as RenderEventElement;
    const firstButton = element.shadowRoot!.querySelector('button')!;

    firstButton.click();
    expect(element.primary).toHaveBeenCalledTimes(1);

    element.alternate = true;
    await nextMicrotask();
    firstButton.click();
    expect(element.primary).toHaveBeenCalledTimes(1);
    expect(element.secondary).toHaveBeenCalledTimes(1);

    document.body.removeChild(element);
    firstButton.click();
    expect(element.secondary).toHaveBeenCalledTimes(1);
  });

  it('keeps stable event listeners attached across unrelated rerenders', async () => {
    const element = document.body.appendChild(
      document.createElement('render-stable-event-element')
    ) as RenderStableEventElement;
    const button = element.shadowRoot!.querySelector('button')!;
    const addSpy = vi.spyOn(button, 'addEventListener');
    const removeSpy = vi.spyOn(button, 'removeEventListener');

    element.count = 1;
    await nextMicrotask();

    expect(addSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    button.click();
    expect(element.clicks).toBe(1);
  });

  it('replaces mounted content when the template shape changes', async () => {
    const element = document.body.appendChild(
      document.createElement('render-shape-element')
    ) as RenderShapeElement;

    expect(element.shadowRoot!.querySelector('#summary')).toBeTruthy();
    element.detail = true;
    await nextMicrotask();

    expect(element.shadowRoot!.querySelector('#summary')).toBeNull();
    expect(element.shadowRoot!.querySelector('#detail')!.textContent).toBe('Detail');
  });

  it('switches renderIntoAnchor between template, primitive, node, and array values', () => {
    const container = document.body.appendChild(document.createElement('div'));
    const anchor = document.createComment('root');
    container.appendChild(anchor);
    const state: RenderState = {};
    const itemTemplate = (items: string[]) =>
      html`<div id="items">${items.map((item) => html`<b>${item}</b>`)}</div>`;

    renderIntoAnchor(html`<span>${'first'}</span>`, anchor, state);
    expect(container.querySelector('span')!.textContent).toBe('first');

    renderIntoAnchor('plain', anchor, state);
    expect(container.textContent).toBe('plain');

    renderIntoAnchor(html`<em>${'second'}</em>`, anchor, state);
    expect(container.querySelector('em')!.textContent).toBe('second');

    const node = document.createElement('strong');
    node.textContent = 'node';
    renderIntoAnchor(node, anchor, state);
    renderIntoAnchor(node, anchor, state);
    expect(container.querySelector('strong')).toBe(node);

    renderIntoAnchor(itemTemplate(['a', 'b']), anchor, state);
    expect(Array.from(container.querySelectorAll('b')).map((item) => item.textContent)).toEqual([
      'a',
      'b',
    ]);

    renderIntoAnchor(itemTemplate(['a']), anchor, state);
    expect(Array.from(container.querySelectorAll('b')).map((item) => item.textContent)).toEqual([
      'a',
    ]);

    renderIntoAnchor(false, anchor, state);
    expect(container.textContent).toBe('');
  });

  it('supports direct event and property edge cases and ignores detached anchors', () => {
    const container = document.body.appendChild(document.createElement('div'));
    const anchor = document.createComment('root');
    container.appendChild(anchor);
    const handler = { handleEvent: vi.fn() };
    const fnHandler = vi.fn();

    renderIntoAnchor(html`<button @click=${handler}>Object listener</button>`, anchor);
    container.querySelector('button')!.click();
    expect(handler.handleEvent).toHaveBeenCalledTimes(1);

    renderIntoAnchor(html`<button @click=${fnHandler}>Function listener</button>`, anchor);
    container.querySelector('button')!.click();
    expect(fnHandler).toHaveBeenCalledTimes(1);

    renderIntoAnchor(html`<!----><input .value=${undefined} />`, anchor);
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('');

    const detachedAnchor = document.createComment('detached');
    expect(() => renderIntoAnchor('detached', detachedAnchor)).not.toThrow();
  });
});

describe('render-aware decorator reactivity', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('rerenders from prop, toggle, primitive state, object state, and array state changes', async () => {
    const element = document.body.appendChild(
      document.createElement('render-reactive-element')
    ) as any;

    element.label = 'updated';
    element.active = true;
    element.count++;
    element.user.name = 'Grace';
    element.items.push({ label: 'Two' });
    element.items[0].label = 'Updated';
    await nextMicrotask();

    expect(element.shadowRoot.querySelector('#label').textContent).toBe('updated');
    expect(element.shadowRoot.querySelector('#active').textContent).toBe('true');
    expect(element.shadowRoot.querySelector('#count').textContent).toBe('1');
    expect(element.shadowRoot.querySelector('#name').textContent).toBe('Grace');
    expect(element.shadowRoot.querySelector('#first').textContent).toBe('Updated');
    expect(element.shadowRoot.querySelector('#size').textContent).toBe('2');
    expect(element.watched[0]).toEqual({ old: 0, new: 1 });

    element.setAttribute('label', 'from-attr');
    element.setAttribute('active', 'false');
    await nextMicrotask();

    expect(element.shadowRoot.querySelector('#label').textContent).toBe('from-attr');
    expect(element.shadowRoot.querySelector('#active').textContent).toBe('');
  });

  it('batches multiple render-aware changes into one microtask render', async () => {
    const element = document.body.appendChild(
      document.createElement('render-reactive-element')
    ) as any;
    expect(element.renderCount).toBe(1);

    element.count = 1;
    element.label = 'queued';
    element.user.name = 'Babbage';
    expect(element.renderCount).toBe(1);
    await nextMicrotask();

    expect(element.renderCount).toBe(2);
  });

  it('keeps state internal and leaves unsupported objects unproxied', async () => {
    const element = document.body.appendChild(
      document.createElement('render-reactive-element')
    ) as any;

    expect((element.constructor as any).observedAttributes).not.toContain('count');
    expect(element.hasAttribute('count')).toBe(false);
    expect(element.created).toBeInstanceOf(Date);

    const renderCount = element.renderCount;
    element.created.setFullYear(2027);
    await nextMicrotask();
    expect(element.renderCount).toBe(renderCount);
  });

  it('covers state proxy cache, proxy reassignment, deletion, and non-proxyable nodes', async () => {
    const disconnected = document.createElement(
      'state-edge-element'
    ) as unknown as StateEdgeElement;
    expect(disconnected.maybe).toBeUndefined();

    const element = document.body.appendChild(
      document.createElement('state-edge-element')
    ) as unknown as StateEdgeElement;

    expect(isStateName(element, 'model')).toBe(true);
    expect(isStateName(element, 'missing')).toBe(false);
    expect(element.shadowRoot!.querySelector('#maybe')!.textContent).toBe('undefined');

    const renderCount = element.renderCount;
    const user = element.model.user;
    expect(element.model.user).toBe(user);

    const sameModel = element.model;
    element.model = sameModel;
    await nextMicrotask();
    expect(element.renderCount).toBe(renderCount);

    element.spanState.textContent = 'not reactive';
    element.mapValue.set('x', 'y');
    await nextMicrotask();
    expect(element.renderCount).toBe(renderCount);

    delete (element.model as { count?: number }).count;
    await nextMicrotask();
    expect(element.shadowRoot!.querySelector('#count')!.textContent).toBe('missing');
    expect(element.renderCount).toBe(renderCount + 1);
  });

  it('runs parent lifecycle hooks, guards duplicate lifecycle calls, and recovers after render errors', async () => {
    const element = document.body.appendChild(
      document.createElement('render-lifecycle-edge-element')
    ) as RenderLifecycleEdgeElement;

    expect(element.connectedCalls).toBe(1);
    (element as any).connectedCallback();
    expect(element.connectedCalls).toBe(1);

    (element as any).__stateValues.label = 'throw';
    expect(() => (element as any).__performRender()).toThrow('render failed');
    expect(element.renderCount).toBe(2);

    (element as any).__stateValues.label = 'recovered';
    (element as any).__performRender();
    expect(element.shadowRoot!.querySelector('#edge')!.textContent).toBe('recovered');

    element.label = 'queued';
    document.body.removeChild(element);
    await nextMicrotask();
    expect(element.disconnectedCalls).toBe(1);
    (element as any).disconnectedCallback();
    expect(element.disconnectedCalls).toBe(1);
  });

  it('mounts static templates once for elements without render methods', () => {
    const element = document.body.appendChild(
      document.createElement('render-static-only-edge')
    ) as RenderStaticOnlyEdge;

    expect(element.shadowRoot!.querySelector('#static-only')!.textContent).toBe('Static only');
    (element as any).__renderStaticTemplate();
    expect(element.shadowRoot!.querySelectorAll('#static-only')).toHaveLength(1);
    expect(() => (element as any).__performRender()).not.toThrow();
  });

  it('disposes primitive render parts and mounts styles in light DOM render targets', () => {
    const primitive = document.body.appendChild(
      document.createElement('render-primitive-edge')
    ) as RenderPrimitiveEdge;

    expect(primitive.shadowRoot!.textContent).toContain('plain render');
    document.body.removeChild(primitive);
    expect(primitive.shadowRoot!.textContent).not.toContain('plain render');

    const light = document.body.appendChild(
      document.createElement('render-light-style-edge')
    ) as RenderLightStyleEdge;

    expect(light.shadowRoot).toBeNull();
    expect(light.querySelector('style')!.textContent).toBe('.light-edge{color:red}');
    expect(light.querySelector('.light-edge')!.textContent).toBe('Light styled');
  });

  it('initializes watched props from existing attributes when props have no own value', () => {
    const element = document.createElement('prop-watch-attr-edge') as PropWatchAttrEdge;
    element.setAttribute('tracked', 'from-attribute');
    document.body.appendChild(element);

    expect(element.seen).toEqual({ new: 'from-attribute' });
  });
});
