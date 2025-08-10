# custom-elements-ts

[![Coverage Status](https://coveralls.io/repos/github/geocine/custom-elements-ts/badge.svg?branch=master)](https://coveralls.io/github/geocine/custom-elements-ts?branch=master)
![CI](https://github.com/geocine/custom-elements-ts/actions/workflows/ci.yml/badge.svg)
[![npm version](https://badge.fury.io/js/custom-elements-ts.svg)](https://www.npmjs.com/package/custom-elements-ts)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)


Create native custom elements using Typescript without using any third party libraries.

```
npm install custom-elements-ts
```

## Usage

```ts
import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'counter-element',
  templateUrl: 'counter-element.html',
  styleUrl: 'counter-element.scss'
})
export class CounterElement extends HTMLElement {
  // code as you would when creating a native HTMLElement
  // full source code is at demo/counter
}
```

```html
<!--index.html-->
<counter-element></counter-element>
<script src="counter.umd.js"></script>
```

## Decorators

| Decorator   | Target   | Parameters         | Description                                                                                                                                                                       |
|-------------|----------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| @Prop()     | property | -                  | custom attribute/properties, reflects primitive properties (string, number, boolean) to attributes                                                                                 |
| @Toggle()   | property | -                  | boolean attribute/properties, it is based on the presence of the attribute but also works with "true" and "false"                                                                 |
| @Dispatch() | property | (event?)           | used to declare a CustomEvent which you could dispatch using the `.emit` method of its type `DispatchEmitter`. The `event` parameter is used to set the name of the `CustomEvent` |
| @Watch()    | method   | (property)         | triggers the method when a `property` is changed                                                                                                                                  |
| @Listen()   | method   | (event, selector?) | listens to an `event` on the `host` element or on the `selector` if specified                                                                                                     |

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
Since `color` is a primitive type of `string` it can be accessed via attributes and properties
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

On the other hand `list` is a rich data type (objects or arrays), and functions/classes can only be accessed/set via property and are not reflected as attributes.

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

### @Toggle()
Toggle attributes work the same way as HTML boolean attributes as defined by [W3C](http://www.w3.org/TR/2008/WD-html5-20080610/semantics.html#boolean) for the most part. We changed a few things to overcome confusion. Check the table below for reference:

| Markup                        | `disabled` | Description                                                          |
|-------------------------------|------------|----------------------------------------------------------------------|
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
    this.onChange.emit({detail: 'event changed'});
    this.onSelect.emit({detail: 'select triggered'});
  }
```
### @Watch()

```ts
import { CustomElement, Dispatch, Prop } from 'custom-elements-ts';

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

Listen has parameters `event` and `selector`. `Event` is any valid javascript event. `Selector` is anything that works with [querySelector()](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)

```ts
import { CustomElement, Dispatch, Prop } from 'custom-elements-ts';

...
export class TodoList extends HTMLElement {
  @Listen('click')
  elementClicked() {
    // triggers when the element is clicked
  }

  @Listen('click','a')
  anchorClicked() {
    // triggers when an `a` inside the element is clicked
  }
}
```

## Setup

### Running the demos

```
npm start <element-name>
```

### Building the demo

```
npm run build <element-name>
```
If you want to create a minified bundle
```
npm run build -- <element-name> --prod
```

### Building the library (publish artifacts)

Builds the library from `src/index.ts` into `dist/` (UMD + ESM builds with typings):

```
npm run bundle
```
