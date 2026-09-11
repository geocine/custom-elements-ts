import { describe, it, expect, afterEach } from 'vitest';
import { CustomElement, Signal, State, TemplateResult, html, signal } from 'custom-elements-ts';

const nextMicrotask = () => Promise.resolve();

interface Row {
  id: number;
  label: Signal<string>;
  selected: Signal<string | null>;
}

@CustomElement({
  tag: 'signal-row-element',
  shadow: false,
})
class SignalRowElement extends HTMLElement {
  @State({ deep: false }) rows: Row[] = [];
  renderCount = 0;

  render(): TemplateResult {
    this.renderCount++;
    return html`<ul>
      ${this.rows.map(
        (row) => html`<li class=${row.selected} .title=${row.label}>${row.label}</li>`
      )}
    </ul>`;
  }
}

describe('signal bindings', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('updates text, attribute, and property directly without re-rendering', async () => {
    const el = document.createElement('signal-row-element') as SignalRowElement;
    document.body.appendChild(el);
    await nextMicrotask();

    const row: Row = { id: 1, label: signal('one'), selected: signal<string | null>(null) };
    el.rows = [row];
    await nextMicrotask();

    const li = el.querySelector('li')!;
    expect(li.textContent).toBe('one');
    expect(li.hasAttribute('class')).toBe(false);
    expect(li.title).toBe('one');
    const renders = el.renderCount;

    // Signal writes go straight to the DOM — no render pass.
    row.label.value = 'uno';
    row.selected.value = 'danger';
    expect(el.renderCount).toBe(renders);
    expect(li.textContent).toBe('uno');
    expect(li.getAttribute('class')).toBe('danger');
    expect(li.title).toBe('uno');

    // Null removes the attribute again.
    row.selected.value = null;
    expect(li.hasAttribute('class')).toBe(false);
  });

  it('keeps bindings across re-renders with the same signal and rebinds on a new one', async () => {
    const el = document.createElement('signal-row-element') as SignalRowElement;
    document.body.appendChild(el);
    await nextMicrotask();

    const row: Row = { id: 1, label: signal('a'), selected: signal<string | null>(null) };
    el.rows = [row];
    await nextMicrotask();

    // Re-render with the same signal instances: binding must survive.
    el.rows = [row];
    await nextMicrotask();
    row.label.value = 'b';
    expect(el.querySelector('li')!.textContent).toBe('b');

    // Re-render with a different signal: old one must be detached.
    const oldLabel = row.label;
    const replacement: Row = { id: 1, label: signal('fresh'), selected: row.selected };
    el.rows = [replacement];
    await nextMicrotask();
    const li = el.querySelector('li')!;
    expect(li.textContent).toBe('fresh');
    oldLabel.value = 'stale write';
    expect(li.textContent).toBe('fresh');
    replacement.label.value = 'newer';
    expect(li.textContent).toBe('newer');
  });

  it('unsubscribes disposed parts and skips notifications with equal values', async () => {
    const el = document.createElement('signal-row-element') as SignalRowElement;
    document.body.appendChild(el);
    await nextMicrotask();

    const label = signal('x');
    const row: Row = { id: 1, label, selected: signal<string | null>(null) };
    el.rows = [row];
    await nextMicrotask();
    expect(el.querySelector('li')).not.toBeNull();

    let calls = 0;
    label.subscribe(() => calls++);
    label.value = 'x'; // equal value: no notification
    expect(calls).toBe(0);
    label.value = 'y';
    expect(calls).toBe(1);

    // Clearing the list disposes parts; writes afterwards must not throw.
    el.rows = [];
    await nextMicrotask();
    expect(el.querySelector('li')).toBeNull();
    expect(() => {
      label.value = 'z';
    }).not.toThrow();
  });
});
