
export interface CustomElementMetadata {
  tag?: string;
  template?: string;
  templateUrl?: string;
  styleUrl?: string;
  style?: string;
}

export const CustomElement = (args: CustomElementMetadata) => {
  return (target: any) => {
    const toKebabCase = string => string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
    const tag: string = args.tag || toKebabCase(target.prototype.constructor.name);
    const customElement: any = class extends (target as { new (): any }) {
      private __connected: boolean = false;

      protected props: {[key: string]: any} = {};
     
      protected static watchAttributes: {[key: string]: string};
      protected static listeners: Array<any>;

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
        const watchAttributes: { [key: string]: string } = (this.constructor as any).watchAttributes;
        if (watchAttributes && watchAttributes[name] && oldValue != newValue) {
          const methodToCall: string = watchAttributes[name];
          this[methodToCall]({old: oldValue, new: newValue});
        }
      }

      connectedCallback() {
        this.__render();
        super.connectedCallback && super.connectedCallback();
        this.__connected = true;

        for (const listener of (this.constructor as any).listeners as Array<any>) {
          this.addEventListener(listener.eventName, listener.handler.bind(this));
        }
 
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