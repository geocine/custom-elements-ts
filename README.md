# custom-elements-ts

Create native custom elements using Typescript without using any third party libraries.

```
npm install custom-elements-ts
```

### Usage

```
import { CustomElement } from 'custom-elements-ts';

@CustomElement({
  tag: 'counter-element',
  templateUrl: 'counter-element.html',
  styleUrls: ['counter-element.scss']
})
export class CounterElement extends HTMLElement {

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