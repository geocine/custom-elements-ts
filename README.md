# custom-elements-ts

[![Coverage Status](https://coveralls.io/repos/github/geocine/custom-elements-ts/badge.svg?branch=master)](https://coveralls.io/github/geocine/custom-elements-ts?branch=master)
![CI](https://github.com/geocine/custom-elements-ts/actions/workflows/ci.yml/badge.svg)
[![npm version](https://badge.fury.io/js/custom-elements-ts.svg)](https://www.npmjs.com/package/custom-elements-ts)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/geocine/custom-elements-ts)

Author native Web Components in TypeScript with a small set of decorators
(`@CustomElement`, `@Prop`, `@State`, `@Watch`, `@Listen`, `@Dispatch`,
`@Toggle`) plus a tiny `html` / `render()` runtime. **Zero dependencies.
Framework-free.**

```
npm install custom-elements-ts
```

> **Live demos:** [geocine.github.io/custom-elements-ts](https://geocine.github.io/custom-elements-ts/) — counter, sprint board, install pill, and a live event log, all built with the library.

## Table of contents

- [Quick start](#quick-start)
  - [Plain HTML — no `render()` required](#plain-html--no-render-required)
  - [Reactive components with `render()`](#reactive-components-with-render)
  - [Template bindings](#template-bindings)
- [Decorators](#decorators)
  - [@Prop()](#prop)
  - [@State()](#state)
  - [@Toggle()](#toggle)
  - [@Dispatch()](#dispatch)
  - [@Watch()](#watch)
  - [@Listen()](#listen)
- [Project layout](#project-layout)
- [Running the demos](#running-the-demos)
- [Building](#building)

## Quick start

There are **two ways** to author a component, and they compose freely:

1. **Plain HTML, imperative updates.** Declare a `template` (or
   `templateUrl`) and update the DOM yourself in `connectedCallback`,
   `@Watch()` handlers, or `@Listen()` handlers. No `render()`. No
   reactive runtime. **Use this when the DOM is mostly static** —
   buttons, badges, panels, copy-to-clipboard pills, and so on.
2. **Reactive `render()` with the `html` helper.** Define `render()` and
   the runtime re-renders for you on `@Prop()` / `@State()` / `@Toggle()`
   changes. Use this for stateful components like dashboards, counters,
   forms, and lists.

`render()` is **optional** — components without it pay zero runtime
cost beyond the decorators themselves.

### Plain HTML — no `render()` required

A small toast-firing "click to copy" pill, written entirely with a
static template and imperative DOM. This is exactly the pattern used by
`<cts-message>` on the [showcase page](https://geocine.github.io/custom-elements-ts/):

```ts
import {
  CustomElement,
  Prop,
  Listen,
  Dispatch,
  DispatchEmitter,
} from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: `
    <div class="row" role="button" tabindex="0">
      <span class="prompt">$</span>
      <code class="cmd"></code>
    </div>
  `,
  styleUrl: './message.element.scss',
})
export class MessageElement extends HTMLElement {
  @Prop() message!: string;

  // Bubbling, composed CustomEvent — any ancestor can listen for it
  // (e.g. a <cts-toast> at the document root).
  @Dispatch('cts:toast') toast!: DispatchEmitter;

  connectedCallback() {
    // Imperative DOM update — no render() needed.
    this.shadowRoot!.querySelector('.cmd')!.textContent = this.message;
  }

  @Listen('click')
  async handleClick() {
    await navigator.clipboard.writeText(this.message);
    this.toast.emit({
      bubbles: true,
      composed: true,
      detail: { title: 'Copied to clipboard', message: this.message },
    });
  }
}
```

```html
<!-- Drop it anywhere — React, Vue, Svelte, plain HTML — it just works -->
<cts-message message="npm install custom-elements-ts"></cts-message>
<script src="message.umd.js"></script>
```

You can also keep markup in its own file with `templateUrl` and
`styleUrl`, exactly as you would with any other framework:

```ts
@CustomElement({
  tag: 'counter-element',
  templateUrl: './counter-element.html',
  styleUrl: './counter-element.scss',
})
export class CounterElement extends HTMLElement {
  // Wire up DOM manually in connectedCallback / @Watch / @Listen.
}
```

### Reactive components with `render()`

Add a `render()` method that returns an `html` template literal and the
runtime takes care of efficient DOM updates whenever any
`@Prop()` / `@State()` / `@Toggle()` value changes:

```ts
import { CustomElement, State, html } from 'custom-elements-ts';

@CustomElement({ tag: 'cts-counter' })
export class CounterElement extends HTMLElement {
  @State() count = 0;

  render() {
    return html`<button @click=${this.increment}>Count: ${this.count}</button>`;
  }

  private increment() {
    this.count++;
  }
}
```

`render()` output is mounted into the shadow root by default. Pass
`shadow: false` to render into the host element instead.

### Template bindings

When you do opt into `render()`, the `html` helper supports the common
binding forms used by render-based components:

```ts
html`<p>${this.label}</p>`;
html`<p>${() => this.label}</p>`;
html`<button @click=${this.handleClick}></button>`;
html`<input .value=${this.value} />`;
html`<div title=${this.title}></div>`;
html`<ul>
  ${this.items.map((item) => html`<li>${item.label}</li>`)}
</ul>`;
```

Attribute bindings remove the attribute when the value is `false`,
`null`, or `undefined`. Event bindings replace old listeners when a
render supplies a new handler and are cleaned up automatically when the
rendered template is disposed.

## Decorators

| Decorator   | Target   | Parameters         | Description                                                                                                                                                                       |
| ----------- | -------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @Prop()     | property | -                  | custom attribute/properties; reflects primitive values (string, number, boolean) to attributes                                                                                    |
| @State()    | property | -                  | private reactive state for render-based components; not reflected to attributes                                                                                                   |
| @Toggle()   | property | -                  | boolean attribute/properties based on the presence of the attribute; also accepts `"true"` and `"false"`                                                                          |
| @Dispatch() | property | (event?)           | declares a `CustomEvent` you can fire via the `.emit` method of its `DispatchEmitter` type. The `event` parameter sets the `CustomEvent` name                                     |
| @Watch()    | method   | (property)         | runs the method when `property` changes                                                                                                                                           |
| @Listen()   | method   | (event, selector?) | listens for `event` on the host (or on `selector` inside the shadow tree)                                                                                                         |

### @Prop()

```ts
import { CustomElement, Prop } from 'custom-elements-ts';

@CustomElement({
  tag: 'todo-list',
  ...
})
export class TodoList extends HTMLElement {
  @Prop() color: string;
  @Prop() list: TodoItem[];
}
```

Since `color` is a primitive type of `string` it can be accessed via
attributes and properties:

```ts
const element = document.querySelector('todo-list');
// accessing value via attribute
const attrValue = element.getAttribute('color');
// setting value via attribute
element.setAttribute('color', 'red');

// accessing value via property
const propertyValue = element.color;
// setting via property
element.color = 'red';
```

`list` is a rich data type (objects or arrays) and functions/classes can
only be accessed/set via property — they are not reflected as
attributes:

```ts
// Functions and classes are not reflected to attributes
@Prop() onChange: (detail: any) => void;
@Prop() itemConstructor: { new(...args: any[]): any };

element.onChange = () => {};
// not reflected as attribute
console.log(element.getAttribute('on-change')); // null

class Foo {}
element.itemConstructor = Foo;
// not reflected as attribute
console.log(element.getAttribute('item-ctor')); // null
```

Render-based components update after a real `@Prop()` value change.
Multiple prop and state changes inside the same synchronous turn are
batched into one render.

### @State()

```ts
import { CustomElement, State, Watch, html } from 'custom-elements-ts';

@CustomElement({ tag: 'profile-card' })
export class ProfileCard extends HTMLElement {
  @State() user = { name: 'Ada' };
  @State() items = [{ label: 'One' }];

  @Watch('user')
  userChanged(value: { old: unknown; new: unknown }) {
    console.log(value.new);
  }

  render() {
    return html`
      <strong>${this.user.name}</strong>
      <ul>
        ${this.items.map((item) => html`<li>${item.label}</li>`)}
      </ul>
    `;
  }
}
```

State is internal to the element: it is not reflected to attributes and
is not included in `observedAttributes`. Plain objects and arrays
assigned to state are deeply proxied, so nested mutations such as
`this.user.name = 'Grace'`, `this.items.push(...)`, and
`this.items[0].label = 'Updated'` schedule a render.

Only plain objects and arrays are proxied. Functions, class
constructors, DOM nodes, `Date`, `Map`, `Set`, `WeakMap`, and `WeakSet`
are left as-is — reassign those values to trigger a render.

### @Toggle()

Toggle attributes work the same way as HTML boolean attributes as
defined by [W3C](http://www.w3.org/TR/2008/WD-html5-20080610/semantics.html#boolean)
for the most part. We changed a few things to overcome confusion. Check
the table below for reference:

| Markup                        | `disabled` | Description                                                          |
| ----------------------------- | ---------- | -------------------------------------------------------------------- |
| `<c-input />`                 | false      | Follows W3C standard                                                 |
| `<c-input disabled/>`         | true       | Follows W3C standard                                                 |
| `<c-input disabled="true"/>`  | true       | Follows W3C standard                                                 |
| `<c-input disabled="asd"/>`   | false      | `false` since `asd` does not evaluate to a valid boolean             |
| `<c-input disabled="false"/>` | false      | `false` since the boolean `false` converted to a string is `"false"` |
| `<c-input disabled="true"/>`  | true       | `true` since the boolean `true` converted to a string is `"true"`    |

### @Dispatch()

**Creating a custom event**

```ts
import { CustomElement, Dispatch, DispatchEmitter } from 'custom-elements-ts';

...
export class TodoList extends HTMLElement {
  // Creating a CustomEvent
  // custom event name will be `on.change`
  @Dispatch() onChange: DispatchEmitter;

  // Creating a CustomEvent with custom name `ce.select`
  @Dispatch('ce.select') onSelect: DispatchEmitter;
}
```

**Triggering the custom event** from the example above:

```ts
  triggerOnChange() {
    // adding more data to the event object
    this.onChange.emit({ detail: 'event changed' });
    this.onSelect.emit({ detail: 'select triggered' });
  }
```

For events that need to cross the shadow boundary (e.g. so a parent or
the document can listen) opt into bubbling and composed delivery on the
`emit()` call:

```ts
this.onChange.emit({
  bubbles: true,
  composed: true,
  detail: { count: this.count },
});
```

### @Watch()

```ts
import { CustomElement, Prop, Watch } from 'custom-elements-ts';

...
export class TodoList extends HTMLElement {
  @Prop() color: string;

  @Watch('color')
  colorChanged() {
    // trigger when color property color changes
    // either via property or attribute
  }
}
```

### @Listen()

`@Listen()` takes an `event` and an optional `selector`. `event` is any
valid JavaScript event. `selector` is anything that works with
[`querySelector()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector).

```ts
import { CustomElement, Listen } from 'custom-elements-ts';

...
export class TodoList extends HTMLElement {
  @Listen('click')
  elementClicked() {
    // triggers when the element is clicked
  }

  @Listen('click', 'a')
  anchorClicked() {
    // triggers when an `a` inside the element is clicked
  }
}
```

## Project layout

```
src/                 # the library — decorators + html/render runtime
demos/
  counter/           # @State() + render() — single counter card
  todo-dashboard/    # composed elements: stats, filters, items, parent
  site/              # the showcase landing page that hosts every live demo
tests/               # vitest specs for the runtime + decorators
tools/               # build / start / bundle scripts
```

The site demo (`demos/site`) imports the counter and the todo-dashboard
elements from sibling demo folders, so the showcase page on
`localhost:3000` runs the **real** components — not screenshots — and
includes a `<cts-event-log>` panel that subscribes to their bubbling
`CustomEvent`s in real time.

## Running the demos

```
npm start <element-name>
```

| Element          | Highlights                                                       |
| ---------------- | ---------------------------------------------------------------- |
| `site`           | Showcase landing page (hero, code preview, live demos, OG graph) |
| `counter`        | `@State()` + `@Watch()` + `@Dispatch()` on a single card         |
| `todo-dashboard` | Parent / child composition with deeply proxied state             |

```
npm start site
npm start counter
npm start todo-dashboard
```

The dev server runs on `http://localhost:3000` and live-reloads on
TypeScript / SCSS / HTML changes.

## Building

### Building a demo

```
npm run build <element-name>
```

For a minified bundle:

```
npm run build -- <element-name> --prod
```

### Building the library (publish artifacts)

Builds the library from `src/index.ts` into `dist/` (UMD + ESM builds
with typings):

```
npm run bundle
```
