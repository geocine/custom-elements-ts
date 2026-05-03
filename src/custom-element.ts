import { addEventListeners, ListenerMetadata } from './listen';
import { initializeProps } from './prop';
import { isStateAttributeName } from './state';
import { renderIntoAnchor, RenderState, TemplateValue } from './template-runtime';
import { toKebabCase, toCamelCase } from './util';

export interface CustomElementMetadata {
  tag?: string;
  template?: string;
  templateUrl?: string;
  styleUrl?: string;
  style?: string;
  shadow?: boolean;
}

export interface KeyValue {
  [key: string]: any;
}

export const CustomElement = (args: CustomElementMetadata) => {
  return (target: any) => {
    const tag: string = args.tag || toKebabCase(target.prototype.constructor.name);
    const customElement: any = class extends (target as { new (): any }) {
      private __connected: boolean = false;
      private __hasMountedStatic: boolean = false;
      private __renderAnchor?: Comment;
      private __renderQueued: boolean = false;
      private __renderState: RenderState = {};
      private __suppressRender: boolean = false;

      props: KeyValue = {};
      __stateValues!: KeyValue;
      __stateProxyCaches!: KeyValue;
      protected static propsInit: KeyValue;
      protected static stateInit: KeyValue;

      protected static watchAttributes: KeyValue;
      protected static listeners: ListenerMetadata[];

      showShadowRoot: boolean;

      static get observedAttributes() {
        const stateInit = this.stateInit || {};
        return Object.keys(this.propsInit || {})
          .filter((x) => stateInit[x] === undefined)
          .map((x) => toKebabCase(x));
      }

      constructor() {
        super();
        this.__stateValues ||= {};
        this.__stateProxyCaches ||= {};
        this.showShadowRoot =
          args.shadow === undefined || args.shadow === null ? true : args.shadow;
        if (!this.shadowRoot && this.showShadowRoot) {
          this.attachShadow({ mode: 'open' });
        }
      }

      attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        this.onAttributeChange(name, oldValue, newValue);
      }

      onAttributeChange(name: string, oldValue: string, newValue: string, set: boolean = true) {
        if (oldValue !== newValue) {
          if (set && !isStateAttributeName(this, name)) {
            const propName = toCamelCase(name);
            (this as any)[propName] = newValue;
          }
          const watchAttributes: KeyValue = (this.constructor as any).watchAttributes;
          if (watchAttributes && watchAttributes[name]) {
            const methodToCall: string = watchAttributes[name];
            if (this.__connected) {
              if (typeof (this as any)[methodToCall] === 'function') {
                (this as any)[methodToCall]({ old: oldValue, new: newValue });
              }
            }
          }
          this.__scheduleRender();
        }
      }

      connectedCallback() {
        if (this.__connected) return;

        this.__connected = true;
        if (!this.__hasRender()) {
          this.__renderStaticTemplate();
        }

        this.__suppressRender = true;
        initializeProps(this);
        this.__suppressRender = false;

        if (this.__hasRender()) {
          this.__mountStaticStyle();
          this.__performRender();
        }

        const parentProto =
          (Object.getPrototypeOf(Object.getPrototypeOf(this)) as {
            connectedCallback?: () => void;
          }) || null;
        if (parentProto && typeof parentProto.connectedCallback === 'function') {
          parentProto.connectedCallback.call(this);
        }

        addEventListeners(this);
      }

      disconnectedCallback() {
        if (!this.__connected) return;
        this.__connected = false;
        this.__renderQueued = false;
        this.__renderState.instance?.dispose();
        this.__renderState.part?.dispose();
        this.__renderState = {};

        const parentProto =
          (Object.getPrototypeOf(Object.getPrototypeOf(this)) as {
            disconnectedCallback?: () => void;
          }) || null;
        if (parentProto && typeof parentProto.disconnectedCallback === 'function') {
          parentProto.disconnectedCallback.call(this);
        }
      }

      __renderStaticTemplate() {
        if (this.__hasMountedStatic) return;
        const template = document.createElement('template');
        const style = `${args.style ? `<style>${args.style}</style>` : ''}`;
        template.innerHTML = `${style}${args.template ? args.template : ''}`;
        (this.showShadowRoot ? this.shadowRoot : this).appendChild(
          document.importNode(template.content, true)
        );
        this.__hasMountedStatic = true;
      }

      __mountStaticStyle() {
        if (this.__hasMountedStatic) return;
        if (args.style) {
          const style = document.createElement('style');
          style.textContent = args.style;
          (this.showShadowRoot ? this.shadowRoot : this).appendChild(style);
        }
        this.__renderAnchor = document.createComment('custom-elements-ts-render');
        (this.showShadowRoot ? this.shadowRoot : this).appendChild(this.__renderAnchor);
        this.__hasMountedStatic = true;
      }

      __notifyPropertyChange(propName: string, oldValue: any, newValue: any) {
        const watchAttributes: KeyValue = (this.constructor as any).watchAttributes;
        const watchName = toKebabCase(propName);
        const methodToCall: string | undefined = watchAttributes?.[watchName];
        if (methodToCall && this.__connected && typeof (this as any)[methodToCall] === 'function') {
          (this as any)[methodToCall]({ old: oldValue, new: newValue });
        }
        this.__scheduleRender();
      }

      __scheduleRender() {
        if (!this.__connected || this.__suppressRender || !this.__hasRender()) {
          return;
        }
        if (this.__renderQueued) {
          return;
        }
        this.__renderQueued = true;
        queueMicrotask(() => {
          if (!this.__connected || !this.__renderQueued) {
            return;
          }
          this.__performRender();
        });
      }

      __performRender() {
        if (!this.__hasRender()) {
          return;
        }
        this.__mountStaticStyle();
        this.__renderQueued = false;
        try {
          const output = (this as any).render() as TemplateValue;
          this.__renderState = renderIntoAnchor(
            output,
            this.__renderAnchor!,
            this.__renderState,
            this
          );
        } finally {
          this.__renderQueued = false;
        }
      }

      __hasRender() {
        return typeof (this as any).render === 'function';
      }
    };

    if (!customElements.get(tag)) {
      customElements.define(tag, customElement);
    }
    return customElement;
  };
};
