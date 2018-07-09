export interface CustomElementMetadata {
  tag?: string;
  template?: string;
  templateUrl?: string;
  styleUrls?: Array<string>;
  styles?: Array<string>;
}

export const CustomElement = (args: CustomElementMetadata) => {
  return (target: any) => {
    const customElement: any = class extends (target as { new (): any }) {

      constructor() {
        super();
        if(!this.shadowRoot){
          this.attachShadow({ mode: 'open' });
        }
      }

      connectedCallback() {
        this.render();
        super.connectedCallback && super.connectedCallback();
      }

      render() {
        const template = document.createElement('template');
        template.innerHTML = `
          <style>${args.styles ? args.styles.join(',') : ''}</style>
          ${args.template ? args.template : ''}`;

          this.shadowRoot.appendChild(document.importNode(template.content, true));
      }
    };

    if(!customElements.get(args.tag)){
      customElements.define(args.tag, customElement);
    }
    return customElement;
  };
};