import { describe, it, expect, afterEach, vi } from 'vitest';
import { CustomElement, State, TemplateResult, html, map } from 'custom-elements-ts';

const nextMicrotask = () => Promise.resolve();

interface Item {
  id: number;
  label: string;
}

const rowSpy = vi.fn();

@CustomElement({
  tag: 'mapped-list-element',
  shadow: false,
})
class MappedListElement extends HTMLElement {
  @State({ deep: false }) items: Item[] = [];

  render(): TemplateResult {
    return html`<ul>
      ${map(this.items, (item) => {
        rowSpy(item.id);
        return html`<li data-id=${item.id}>${item.label}</li>`;
      })}
    </ul>`;
  }
}

describe('map() identity-based list rendering', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    rowSpy.mockClear();
  });

  const mount = async (): Promise<MappedListElement> => {
    const el = document.createElement('mapped-list-element') as MappedListElement;
    document.body.appendChild(el);
    await nextMicrotask();
    return el;
  };

  it('renders mapped items and skips rows whose item is identical on rerender', async () => {
    const el = await mount();
    const a = { id: 1, label: 'one' };
    const b = { id: 2, label: 'two' };
    el.items = [a, b];
    await nextMicrotask();

    const listItems = el.querySelectorAll('li');
    expect(listItems.length).toBe(2);
    expect(listItems[1].textContent).toBe('two');
    expect(rowSpy).toHaveBeenCalledTimes(2);

    // Replace only the second item; the first row must be skipped entirely.
    rowSpy.mockClear();
    el.items = [a, { id: 2, label: 'TWO' }];
    await nextMicrotask();

    expect(rowSpy).toHaveBeenCalledTimes(1);
    expect(rowSpy).toHaveBeenCalledWith(2);
    expect(el.querySelectorAll('li')[1].textContent).toBe('TWO');
    expect(el.querySelectorAll('li')[0].textContent).toBe('one');
  });

  it('grows, shrinks, and fast-clears mapped lists', async () => {
    const el = await mount();
    const items = [
      { id: 1, label: 'one' },
      { id: 2, label: 'two' },
      { id: 3, label: 'three' },
    ];
    el.items = items;
    await nextMicrotask();
    expect(el.querySelectorAll('li').length).toBe(3);

    // Shrink: first item kept by identity, rest removed.
    rowSpy.mockClear();
    el.items = [items[0]];
    await nextMicrotask();
    expect(el.querySelectorAll('li').length).toBe(1);
    expect(rowSpy).not.toHaveBeenCalled();

    // Grow again.
    el.items = [items[0], { id: 9, label: 'nine' }];
    await nextMicrotask();
    const grown = el.querySelectorAll('li');
    expect(grown.length).toBe(2);
    expect(grown[1].textContent).toBe('nine');

    // Clear to empty, then repopulate.
    el.items = [];
    await nextMicrotask();
    expect(el.querySelectorAll('li').length).toBe(0);

    el.items = [{ id: 5, label: 'five' }];
    await nextMicrotask();
    expect(el.querySelectorAll('li').length).toBe(1);
    expect(el.querySelector('li')!.textContent).toBe('five');
  });
});

@CustomElement({
  tag: 'shallow-state-element',
  shadow: false,
})
class ShallowStateElement extends HTMLElement {
  @State({ deep: false }) data: Item[] = [];
  renderCount = 0;

  render(): TemplateResult {
    this.renderCount++;
    return html`<p>${this.data.length ? this.data[0].label : 'empty'}</p>`;
  }
}

describe('@State({ deep: false })', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not proxy values and only rerenders on reassignment', async () => {
    const el = document.createElement('shallow-state-element') as ShallowStateElement;
    document.body.appendChild(el);
    await nextMicrotask();

    const raw = [{ id: 1, label: 'one' }];
    el.data = raw;
    await nextMicrotask();
    // Shallow state stores the value as-is (no proxy wrapper).
    expect(el.data).toBe(raw);
    expect(el.querySelector('p')!.textContent).toBe('one');
    const renders = el.renderCount;

    // Nested mutation must not schedule a render.
    el.data[0].label = 'mutated';
    await nextMicrotask();
    expect(el.renderCount).toBe(renders);
    expect(el.querySelector('p')!.textContent).toBe('one');

    // Reassignment rerenders.
    el.data = el.data.slice();
    await nextMicrotask();
    expect(el.renderCount).toBe(renders + 1);
    expect(el.querySelector('p')!.textContent).toBe('mutated');
  });
});
