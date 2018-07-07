interface CustomElementMetadata {
  tag?: string;
  template?: string;
  styles?: string;
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
          <style>${args.styles ? args.styles : ''}</style>
          ${args.template ? args.template : ''}`;

          this.shadowRoot.appendChild(document.importNode(template.content, true));
      }
    };

    // Define element in customElements registry
    // if(!customElements.get(args.tag)){
    //   customElements.define(args.tag, customElement);
    // }
    return customElement;
  };
};