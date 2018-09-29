# custom-elements-ts

[![Coverage Status](https://coveralls.io/repos/github/geocine/custom-elements-ts/badge.svg?branch=master)](https://coveralls.io/github/geocine/custom-elements-ts?branch=master) 
[![Build Status](https://travis-ci.org/geocine/custom-elements-ts.svg?branch=master)](https://travis-ci.org/geocine/custom-elements-ts)
[![npm version](https://badge.fury.io/js/custom-elements-ts.svg)](https://www.npmjs.com/package/custom-elements-ts)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)


Create native custom elements using Typescript without using any third party libraries.

```
npm install custom-elements-ts
```

### Usage

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

### Decorators

| Decorator   | Target   | Parameters        | Description                                                                                                        |
|-------------|----------|-------------------|--------------------------------------------------------------------------------------------------------------------|
| @Prop()     | property | -                 | custom attribute/properties, reflects primitive properties to attributes                                           |
| @Toggle()   | property | -                 | boolean attribute/properties, it is based on the presence of the attribute but also works with "true" and "false"  |
| @Dispatch() | property | -                 | use to declare a CustomEvent which you could dispatch using the `.emit` method of its type `DispatchEmitter`       |
| @Watch()    | method   | (property)        | triggers the method when a `property` is changed                                                                   |
| @Listen()   | method   | (event, selector) | listens to an `event` on the `host` element or on the `selector` if specified                                      |
#### @Prop()
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
element.setAttribute('color') = 'red';
 
// accessing value via property
const propertyValue = element.color;
// setting via property
element.color = 'red';
```
 


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
