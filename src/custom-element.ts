import { addEventListeners, ListenerMetadata } from './listen';
import { initializeProps, toKebabCase } from './prop';

export interface CustomElementMetadata {
  tag?: string;
  template?: string;
  templateUrl?: string;
  styleUrl?: string;
  style?: string;
}

export interface KeyValue {
  [key: string ]: any;
}

export const CustomElement = (args: CustomElementMetadata) => {
  return (target: any) => {
    const tag: string = args.tag || toKebabCase(target.prototype.constructor.name);
    const customElement: any = class extends (target as { new (): any }) {
      protected static __connected: boolean = false;

      props: KeyValue = {};
      protected static propsInit: KeyValue = {};

      protected static watchAttributes: KeyValue;
      protected static listeners: ListenerMetadata[];

      static get observedAttributes() {
        return Object.keys(this.watchAttributes || {});
      }

      constructor() {
        super();
        if(!this.shadowRoot){
          this.attachShadow({ mode: 'open' });
        }
      }

      attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        const watchAttributes: KeyValue = (this.constructor as any).watchAttributes;
        if (watchAttributes && watchAttributes[name] && oldValue != newValue) {
          const methodToCall: string = watchAttributes[name];
          if(this.__connected){
            this[methodToCall]({old: oldValue, new: newValue});
          }
        }
      }

      connectedCallback() {
        this.__render();
        super.connectedCallback && super.connectedCallback();
        this.__connected = true;

        addEventListeners(this);
        initializeProps(this);
      }

      __render() {
        if(this.__connected) return;
        const template = document.createElement('template');
        template.innerHTML = `
          <style>${args.style ? args.style : ''}</style>
          ${args.template ? args.template : ''}`;

          this.shadowRoot.appendChild(document.importNode(template.content, true));
      }
    };

    if(!customElements.get(tag)){
      customElements.define(tag, customElement);
    }
    return customElement;
  };
};