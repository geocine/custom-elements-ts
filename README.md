# custom-elements-ts

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
}
```

### Running the demos

```
npm start <element-name>
```
eg. If you want to run the `counter-element` demo

```
npm start counter-element
```

### Building the demo

```
npm build <element-name>
```
eg. If you want to build the `counter-element` demo

```
npm build counter-element
```