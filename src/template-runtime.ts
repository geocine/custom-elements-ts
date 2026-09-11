export type PrimitiveTemplateValue = string | number | boolean | null | undefined;
export type TemplateEventHandler = (event: any) => void;

export type TemplateValue =
  | PrimitiveTemplateValue
  | Node
  | TemplateResult
  | TemplateValue[]
  | MappedTemplates<unknown>
  | (() => TemplateValue)
  | TemplateEventHandler
  | EventListenerObject;

/**
 * A lazily-mapped list, as returned by `map()`. Handing the list and the
 * mapping function to the renderer (instead of an array of TemplateResults)
 * lets it skip rows whose item is identical (`===`) to the item the row was
 * built from — no template call, no part updates, no visit.
 */
export interface MappedTemplates<T> {
  readonly items: readonly T[];
  readonly fn: (item: T, index: number) => TemplateValue;
  readonly __customElementsTsMapped: true;
}

export const map = <T>(
  items: readonly T[],
  fn: (item: T, index: number) => TemplateValue
): MappedTemplates<T> => ({
  items,
  fn,
  __customElementsTsMapped: true,
});

const isMappedTemplates = (value: unknown): value is MappedTemplates<unknown> => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as MappedTemplates<unknown>).__customElementsTsMapped === true
  );
};

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

type PartKind = 'child' | 'attr' | 'prop' | 'event';

interface PartDescriptor {
  kind: PartKind;
  /** Attribute / property / event name. Empty string for child parts. */
  name: string;
  /** childNodes index path from the template root to the part's node. */
  path: number[];
}

interface ParsedTemplate {
  /** Pristine parsed content, cloned for each instance. */
  content: DocumentFragment;
  /** Part descriptors indexed by expression position. */
  parts: PartDescriptor[];
  /**
   * True when the template has exactly one root element; instances then
   * clone that element directly, skipping a DocumentFragment per clone.
   */
  singleRoot: boolean;
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

  let root: Node;
  let nodes: ChildNode[];
  if (parsed.singleRoot) {
    root = parsed.content.firstChild!.cloneNode(true);
    nodes = [root as ChildNode];
  } else {
    root = parsed.content.cloneNode(true);
    nodes = Array.from(root.childNodes);
  }

  // Resolve each precompiled index path directly to its node — no tree
  // walking or attribute scanning per instance.
  const descriptors = parsed.parts;
  const count = descriptors.length;
  const parts: Part[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const d = descriptors[i];
    let node: Node = root;
    const path = d.path;
    for (let j = 0; j < path.length; j++) {
      node = node.childNodes[path[j]];
    }
    if (d.kind === 'child') {
      parts[i] = new ChildPart(node as Comment, host);
    } else if (d.kind === 'event') {
      parts[i] = new EventPart(node as Element, d.name, host);
    } else if (d.kind === 'prop') {
      parts[i] = new PropertyPart(node as Element, d.name);
    } else {
      parts[i] = new AttributePart(node as Element, d.name);
    }
  }
  const values = result.values;
  for (let i = 0; i < count; i++) {
    parts[i].update(values[i]);
  }

  return {
    strings: result.strings,
    nodes,
    update(newValues: TemplateValue[]) {
      for (let i = 0; i < count; i++) {
        parts[i].update(newValues[i]);
      }
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

  const template = document.createElement('template');
  template.innerHTML = parsedHtml;
  const content = template.content;

  // Whitespace-only text nodes inside table-structure elements are never
  // rendered; removing them once here makes every clone smaller and faster.
  stripTableWhitespace(content);

  // Discover parts once at parse time and record index paths to their nodes.
  const markerToIndex = new Map(markers.map((marker, index) => [marker, index]));
  const descriptors: PartDescriptor[] = new Array(markers.length);
  const walker = document.createTreeWalker(
    content,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
  );
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.COMMENT_NODE) {
      const index = markerToIndex.get(current.nodeValue || '');
      if (index !== undefined) {
        (current as Comment).textContent = '';
        descriptors[index] = { kind: 'child', name: '', path: getNodePath(current, content) };
      }
    } else {
      const element = current as Element;
      let elementPath: number[] | undefined;
      Array.from(element.attributes).forEach((attribute) => {
        const index = markerToIndex.get(attribute.value);
        if (index === undefined) {
          return;
        }
        const name = attribute.name;
        element.removeAttribute(name);
        elementPath ||= getNodePath(element, content);
        const kind: PartKind = name.startsWith('@')
          ? 'event'
          : name.startsWith('.')
            ? 'prop'
            : 'attr';
        descriptors[index] = {
          kind,
          name: kind === 'attr' ? name : name.slice(1),
          path: elementPath,
        };
      });
    }
    current = walker.nextNode();
  }

  const singleRoot =
    content.childNodes.length === 1 && content.firstChild!.nodeType === Node.ELEMENT_NODE;
  if (singleRoot) {
    // Paths become relative to the root element instead of the fragment.
    for (const descriptor of descriptors) {
      descriptor?.path.shift();
    }
  }

  const parsed: ParsedTemplate = { content, parts: descriptors, singleRoot };
  templateCache.set(strings, parsed);
  return parsed;
};

const getNodePath = (node: Node, root: Node): number[] => {
  const path: number[] = [];
  let current: Node = node;
  while (current !== root) {
    const parent = current.parentNode!;
    path.push(Array.prototype.indexOf.call(parent.childNodes, current));
    current = parent;
  }
  return path.reverse();
};

/** Elements whose whitespace-only text children are never rendered. */
const tableTags = ['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'];

const stripTableWhitespace = (el: Node): void => {
  const isTable =
    el.nodeType === Node.ELEMENT_NODE && tableTags.indexOf((el as Element).tagName) !== -1;
  let child = el.firstChild;
  while (child) {
    const next = child.nextSibling;
    if (child.nodeType === Node.ELEMENT_NODE) {
      stripTableWhitespace(child);
    } else if (isTable && child.nodeType === Node.TEXT_NODE && !child.nodeValue!.trim()) {
      (child as ChildNode).remove();
    }
    child = next;
  }
};

const isAttributePosition = (text: string): boolean => {
  const lastOpen = text.lastIndexOf('<');
  const lastClose = text.lastIndexOf('>');
  if (lastOpen < lastClose) {
    return false;
  }
  return /[^\s<>"'=/]+\s*=\s*["']?$/.test(text);
};

class ChildPart implements Part {
  private kind: 'empty' | 'text' | 'node' | 'template' | 'array' = 'empty';
  private nodes: ChildNode[] = [];
  private templateInstance?: TemplateInstance;
  private arrayItems: Array<{ anchor: Comment; part: ChildPart }> = [];
  /** Items a map() list was last rendered from, aligned with arrayItems. */
  private lastItems: unknown[] | null = null;

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
    if (isMappedTemplates(resolved)) {
      this.updateMapped(resolved);
      return;
    }
    if (Array.isArray(resolved)) {
      this.lastItems = null;
      if (resolved.length === 0) {
        // Clearing a list routes through clear() so it can take the
        // whole-parent fast path instead of removing items one by one.
        this.clear();
        this.kind = 'array';
        return;
      }
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
    this.lastItems = null;
    if (this.fastClear()) {
      // The subtree was discarded wholesale; just drop references. Event
      // listeners and nested parts are garbage-collected with their nodes.
      this.templateInstance = undefined;
      this.arrayItems = [];
      this.nodes = [];
      this.kind = 'empty';
      return;
    }
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

  /**
   * When this part's content spans its whole parent (the anchor is the
   * parent's first child and the content ends the parent), the parent can be
   * emptied with one textContent write instead of removing every node
   * individually — much faster for large lists.
   */
  private fastClear(): boolean {
    if (this.kind === 'empty') {
      return false;
    }
    const parent = this.anchor.parentNode;
    if (!parent || this.anchor.previousSibling) {
      return false;
    }
    const end = this.getEndNode();
    if (end === this.anchor || end.nextSibling) {
      return false;
    }
    parent.textContent = '';
    parent.appendChild(this.anchor);
    return true;
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

  private updateMapped(mapped: MappedTemplates<unknown>): void {
    const items = mapped.items as unknown[];
    const fn = mapped.fn as (item: unknown, index: number) => TemplateValue;
    const length = items.length;

    if (length === 0) {
      this.clear();
      this.kind = 'array';
      this.lastItems = [];
      return;
    }
    if (this.kind !== 'array') {
      this.clear();
      this.kind = 'array';
    }

    const last = this.lastItems;
    // Identity skips are only valid while lastItems mirrors arrayItems.
    const canSkip = last !== null && last.length === this.arrayItems.length;

    while (this.arrayItems.length > length) {
      const item = this.arrayItems.pop()!;
      item.part.dispose();
      item.anchor.parentNode?.removeChild(item.anchor);
    }

    for (let index = 0; index < length; index++) {
      let entry = this.arrayItems[index];
      if (!entry) {
        const itemAnchor = document.createComment('');
        insertAfter(this.getEndNode(), [itemAnchor]);
        entry = { anchor: itemAnchor, part: new ChildPart(itemAnchor, this.host) };
        this.arrayItems[index] = entry;
      } else if (canSkip && last![index] === items[index]) {
        // The row still holds the item it was built from: nothing to do.
        continue;
      }
      entry.part.update(fn(items[index], index));
    }

    // Remember the items so the next render can identity-skip unchanged rows.
    let copy = this.lastItems;
    if (copy === null || copy.length !== length) {
      copy = new Array(length);
      this.lastItems = copy;
    }
    for (let index = 0; index < length; index++) {
      copy[index] = items[index];
    }
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
