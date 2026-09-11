# Rendering helpers

Components with a `render()` method use the `html` tagged template to
describe their DOM. Alongside it, the library ships two helpers for
high-performance rendering — `map()` for lists and `signal()` for
fine-grained updates — plus a shallow mode for `@State`.

These are additive: plain templates and deeply-proxied state keep
working exactly as before. Reach for these helpers when a component
renders large lists or updates hot values frequently.

## Lists with map()

`map(items, fn)` replaces `items.map(...)` inside a template. Instead of
an array of ready-made templates, the renderer receives the items and
the mapping function — which lets it skip work by comparing item
identity across renders:

```ts
import { CustomElement, State, html, map } from 'custom-elements-ts';

interface Todo {
  id: number;
  label: string;
}

@CustomElement({ tag: 'todo-list', shadow: false })
export class TodoList extends HTMLElement {
  @State({ deep: false }) items: Todo[] = [];

  render() {
    return html`<ul>
      ${map(this.items, (item) => html`<li>${item.label}</li>`)}
    </ul>`;
  }
}
```

What the renderer does with it:

- **Unchanged rows are skipped entirely.** A row whose item is the same
  object (`===`) as the previous render costs one comparison — the
  mapping function is not called and the row's DOM is not visited.
- **Removals detach instead of rewriting.** When items are removed and
  the remaining order is unchanged, only the removed rows' DOM is
  detached; every other row is untouched.
- **Clearing is one operation.** Setting the list to `[]` (or clearing
  it any other way) empties the parent container wholesale when the list
  fills it, instead of removing rows one by one.

The contract this implies: **replace changed items, don't mutate them.**

```ts
update(index: number, label: string) {
  const items = this.items.slice();
  items[index] = { ...items[index], label };
  this.items = items; // reassignment schedules one batched render
}
```

If you mutate an item in place, its identity doesn't change, so `map()`
will skip the row. Use a `signal()` for values you want to mutate
directly (below), or deep `@State` if you prefer mutation-based updates
and the list is small.

## Signals

`signal(initialValue)` creates a standalone reactive value. When a
signal is embedded in a template, the binding subscribes that exact DOM
location to it — a text node, an attribute, or a `.property`. Assigning
`.value` writes to that one node directly. No component re-render, no
template evaluation, no diffing.

```ts
import { CustomElement, State, html, map, signal, Signal } from 'custom-elements-ts';

interface Row {
  id: number;
  label: Signal<string>;
  selected: Signal<string | null>;
}

const makeRow = (id: number, label: string): Row => ({
  id,
  label: signal(label),
  selected: signal<string | null>(null),
});

@CustomElement({ tag: 'data-table', shadow: false })
export class DataTable extends HTMLElement {
  @State({ deep: false }) rows: Row[] = [];
  private selectedRow: Row | null = null;

  render() {
    return html`<table>
      <tbody>
        ${map(
          this.rows,
          (row) => html`<tr class=${row.selected}>
            <td>${row.id}</td>
            <td>${row.label}</td>
          </tr>`
        )}
      </tbody>
    </table>`;
  }

  select(row: Row) {
    if (this.selectedRow) this.selectedRow.selected.value = null;
    row.selected.value = 'danger'; // one attribute write, no render
    this.selectedRow = row;
  }

  rename(row: Row, label: string) {
    row.label.value = label; // one text-node write, no render
  }
}
```

Behavior details:

- **Equality guard.** Assigning a value that is `===` the current one is
  a no-op; subscribers are not notified.
- **Attribute semantics.** In attribute position, `null`, `undefined`,
  and `false` remove the attribute; other values are stringified — the
  same rules as plain attribute bindings.
- **Re-renders are free.** A render that passes the same signal to the
  same binding leaves the subscription untouched. Passing a different
  signal (or a plain value) detaches the old one automatically.
- **No manual cleanup.** Bindings hold their DOM node behind a weak
  reference. When rendered DOM is discarded — a list clear, a removed
  row, a replaced subtree — the subscription unsubscribes itself on the
  next write. You never need to unsubscribe by hand.
- **Outside templates**, subscribe directly:

  ```ts
  const count = signal(0);
  const log = (v: number) => console.log('count is now', v);
  count.subscribe(log);
  count.value = 1; // logs
  count.unsubscribe(log);
  ```

## Shallow state

`@State()` deep-proxies plain objects and arrays so nested mutations
re-render automatically. That convenience has a cost proportional to the
size of the data — one proxy per touched object — which is wasted when
you follow the replace-on-change pattern anyway.

`@State({ deep: false })` stores the value as-is:

- No proxies are created; reads return the exact object you assigned.
- Nested mutations do **not** schedule renders.
- Reassigning the property schedules one batched render.

```ts
@State({ deep: false }) rows: Row[] = [];

add(row: Row) {
  this.rows = this.rows.concat(row);
}

remove(id: number) {
  this.rows = this.rows.filter((r) => r.id !== id);
}
```

## Putting it together

The three features are designed to compose:

- `@State({ deep: false })` holds the list cheaply.
- `map()` skips every row whose item didn't change.
- `signal()` fields inside items update hot values (a label, a selected
  class) without touching the list at all.
