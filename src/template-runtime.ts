export type PrimitiveTemplateValue = string | number | boolean | null | undefined;
export type TemplateEventHandler = (event: any) => void;

export type TemplateValue =
  | PrimitiveTemplateValue
  | Node
  | TemplateResult
  | TemplateValue[]
  | (() => TemplateValue)
  | TemplateEventHandler
  | EventListenerObject;

export interface TemplateResult {
  readonly strings: TemplateStringsArray;
  readonly values: TemplateValue[];
  readonly __customElementsTsTemplateResult: true;
}

export interface TemplateInstance {
  readonly strings: TemplateStringsArray;
  readonly nodes: ChildNode[];
  update(values: TemplateValue[]): void;
  dispose(): void;
}

interface Part {
  update(value: TemplateValue): void;
  dispose(): void;
}

export interface RenderState {
  instance?: TemplateInstance;
  part?: ChildPart;
}

interface ParsedTemplate {
  html: string;
  markers: string[];
}

const templateCache = new WeakMap<TemplateStringsArray, ParsedTemplate>();

export const html = (
  strings: TemplateStringsArray,
  ...values: TemplateValue[]
): TemplateResult => ({
  strings,
  values,
  __customElementsTsTemplateResult: true,
});

export const isTemplateResult = (value: unknown): value is TemplateResult => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as TemplateResult).__customElementsTsTemplateResult === true
  );
};

export const renderIntoAnchor = (
  value: TemplateValue,
  anchor: Comment,
  state: RenderState = {},
  host?: unknown
): RenderState => {
  if (isTemplateResult(value)) {
    if (state.part) {
      state.part.dispose();
      state.part = undefined;
    }
    if (state.instance && state.instance.strings === value.strings) {
      state.instance.update(value.values);
      return state;
    }
    if (state.instance) {
      state.instance.dispose();
    }
    state.instance = createTemplateInstance(value, host);
    insertAfter(anchor, state.instance.nodes);
    return state;
  }

  if (state.instance) {
    state.instance.dispose();
    state.instance = undefined;
  }
  if (!state.part) {
    state.part = new ChildPart(anchor, host);
  }
  state.part.update(value);
  return state;
};

const createTemplateInstance = (result: TemplateResult, host?: unknown): TemplateInstance => {
  const parsed = getParsedTemplate(result.strings);
  const template = document.createElement('template');
  template.innerHTML = parsed.html;

  const fragment = document.importNode(template.content, true);
  const parts = discoverParts(fragment, parsed.markers, host);
  const nodes = Array.from(fragment.childNodes);
  parts.forEach((part, index) => part.update(result.values[index]));

  return {
    strings: result.strings,
    nodes,
    update(values: TemplateValue[]) {
      parts.forEach((part, index) => part.update(values[index]));
    },
    dispose() {
      parts.forEach((part) => part.dispose());
      nodes.forEach((node) => node.parentNode?.removeChild(node));
    },
  };
};

const getParsedTemplate = (strings: TemplateStringsArray): ParsedTemplate => {
  const cached = templateCache.get(strings);
  if (cached) {
    return cached;
  }

  const markers: string[] = [];
  let parsedHtml = '';
  for (let index = 0; index < strings.length - 1; index++) {
    parsedHtml += strings[index];
    const marker = `__custom_elements_ts_marker_${index}__`;
    markers.push(marker);
    parsedHtml += isAttributePosition(strings[index]) ? marker : `<!--${marker}-->`;
  }
  parsedHtml += strings[strings.length - 1];

  const parsed = { html: parsedHtml, markers };
  templateCache.set(strings, parsed);
  return parsed;
};

const isAttributePosition = (text: string): boolean => {
  const lastOpen = text.lastIndexOf('<');
  const lastClose = text.lastIndexOf('>');
  if (lastOpen < lastClose) {
    return false;
  }
  return /[^\s<>"'=/]+\s*=\s*["']?$/.test(text);
};

const discoverParts = (fragment: DocumentFragment, markers: string[], host?: unknown): Part[] => {
  const parts: Part[] = new Array(markers.length);
  const markerToIndex = new Map(markers.map((marker, index) => [marker, index]));
  const walker = document.createTreeWalker(
    fragment,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
  );

  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.COMMENT_NODE) {
      const marker = current.nodeValue || '';
      const index = markerToIndex.get(marker);
      if (index !== undefined) {
        parts[index] = new ChildPart(current as Comment, host);
      }
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      discoverAttributeParts(current as Element, markerToIndex, parts, host);
    }
    current = walker.nextNode();
  }

  return parts;
};

const discoverAttributeParts = (
  element: Element,
  markerToIndex: Map<string, number>,
  parts: Part[],
  host?: unknown
) => {
  Array.from(element.attributes).forEach((attribute) => {
    const index = markerToIndex.get(attribute.value);
    if (index === undefined) {
      return;
    }

    const name = attribute.name;
    element.removeAttribute(name);
    if (name.startsWith('@')) {
      parts[index] = new EventPart(element, name.slice(1), host);
    } else if (name.startsWith('.')) {
      parts[index] = new PropertyPart(element, name.slice(1));
    } else {
      parts[index] = new AttributePart(element, name);
    }
  });
};

class ChildPart implements Part {
  private kind: 'empty' | 'text' | 'node' | 'template' | 'array' = 'empty';
  private nodes: ChildNode[] = [];
  private templateInstance?: TemplateInstance;
  private arrayItems: Array<{ anchor: Comment; part: ChildPart }> = [];

  constructor(
    private anchor: Comment,
    private host?: unknown
  ) {}

  update(value: TemplateValue): void {
    const resolved = resolveValue(value);
    if (resolved === null || resolved === undefined || resolved === false) {
      this.clear();
      return;
    }
    if (Array.isArray(resolved)) {
      this.updateArray(resolved);
      return;
    }
    if (isTemplateResult(resolved)) {
      this.updateTemplate(resolved);
      return;
    }
    if (resolved instanceof Node) {
      this.updateNode(resolved);
      return;
    }
    this.updateText(String(resolved));
  }

  dispose(): void {
    this.clear();
  }

  private clear(): void {
    this.templateInstance?.dispose();
    this.templateInstance = undefined;
    this.arrayItems.forEach((item) => {
      item.part.dispose();
      item.anchor.parentNode?.removeChild(item.anchor);
    });
    this.arrayItems = [];
    this.nodes.forEach((node) => node.parentNode?.removeChild(node));
    this.nodes = [];
    this.kind = 'empty';
  }

  private updateText(value: string): void {
    if (this.kind === 'text' && this.nodes[0]?.nodeType === Node.TEXT_NODE) {
      if (this.nodes[0].nodeValue !== value) {
        this.nodes[0].nodeValue = value;
      }
      return;
    }
    this.clear();
    const text = document.createTextNode(value);
    insertAfter(this.anchor, [text]);
    this.nodes = [text];
    this.kind = 'text';
  }

  private updateNode(value: Node): void {
    if (this.kind === 'node' && this.nodes[0] === value) {
      return;
    }
    this.clear();
    insertAfter(this.anchor, [value as ChildNode]);
    this.nodes = [value as ChildNode];
    this.kind = 'node';
  }

  private updateTemplate(value: TemplateResult): void {
    if (this.kind === 'template' && this.templateInstance?.strings === value.strings) {
      this.templateInstance.update(value.values);
      return;
    }
    this.clear();
    this.templateInstance = createTemplateInstance(value, this.host);
    insertAfter(this.anchor, this.templateInstance.nodes);
    this.nodes = this.templateInstance.nodes;
    this.kind = 'template';
  }

  private updateArray(values: TemplateValue[]): void {
    if (this.kind !== 'array') {
      this.clear();
      this.kind = 'array';
    }

    while (this.arrayItems.length > values.length) {
      const item = this.arrayItems.pop()!;
      item.part.dispose();
      item.anchor.parentNode?.removeChild(item.anchor);
    }

    for (let index = 0; index < values.length; index++) {
      let item = this.arrayItems[index];
      if (!item) {
        const itemAnchor = document.createComment('custom-elements-ts-array-item');
        insertAfter(this.getEndNode(), [itemAnchor]);
        item = {
          anchor: itemAnchor,
          part: new ChildPart(itemAnchor, this.host),
        };
        this.arrayItems[index] = item;
      }
      item.part.update(values[index]);
    }
  }

  private getEndNode(): ChildNode {
    const lastItem = this.arrayItems[this.arrayItems.length - 1];
    if (lastItem) {
      return lastItem.part.getEndNode();
    }
    return this.nodes[this.nodes.length - 1] || this.anchor;
  }
}

class AttributePart implements Part {
  private currentValue: TemplateValue | typeof noValue = noValue;

  constructor(
    private element: Element,
    private name: string
  ) {}

  update(value: TemplateValue): void {
    const resolved = resolveValue(value);
    if (Object.is(this.currentValue, resolved)) {
      return;
    }
    this.currentValue = resolved;
    if (resolved === false || resolved === null || resolved === undefined) {
      this.element.removeAttribute(this.name);
    } else {
      this.element.setAttribute(this.name, String(resolved));
    }
  }

  dispose(): void {
    this.currentValue = noValue;
    this.element.removeAttribute(this.name);
  }
}

class PropertyPart implements Part {
  private currentValue: TemplateValue | typeof noValue = noValue;

  constructor(
    private element: Element,
    private name: string
  ) {}

  update(value: TemplateValue): void {
    const resolved = resolveValue(value);
    if (Object.is(this.currentValue, resolved)) {
      return;
    }
    this.currentValue = resolved;
    (this.element as any)[this.name] = resolved === null || resolved === undefined ? '' : resolved;
  }

  dispose(): void {
    this.currentValue = noValue;
    (this.element as any)[this.name] = '';
  }
}

class EventPart implements Part {
  private currentValue: TemplateValue | typeof noValue = noValue;
  private listener?: EventListenerOrEventListenerObject;

  constructor(
    private element: Element,
    private eventName: string,
    private host?: unknown
  ) {}

  update(value: TemplateValue): void {
    if (Object.is(this.currentValue, value)) {
      return;
    }
    this.currentValue = value;
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener);
      this.listener = undefined;
    }
    if (typeof value === 'function') {
      const handler = value as unknown as (event: Event) => void;
      this.listener = ((event: Event) =>
        handler.call(this.host || this.element, event)) as EventListener;
      this.element.addEventListener(this.eventName, this.listener);
    } else if (isEventListenerObject(value)) {
      this.listener = value;
      this.element.addEventListener(this.eventName, this.listener);
    }
  }

  dispose(): void {
    this.currentValue = noValue;
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener);
      this.listener = undefined;
    }
  }
}

const resolveValue = (value: TemplateValue): TemplateValue => {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => TemplateValue)();
  }
  return value;
};

const isEventListenerObject = (value: unknown): value is EventListenerObject => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as EventListenerObject).handleEvent === 'function'
  );
};

const noValue = Symbol('custom-elements-ts-no-value');

const insertAfter = (anchor: ChildNode, nodes: ChildNode[]) => {
  let reference = anchor.nextSibling;
  const parent = anchor.parentNode;
  if (!parent) {
    return;
  }
  nodes.forEach((node) => {
    parent.insertBefore(node, reference);
    reference = node.nextSibling;
  });
};

export { ChildPart };
