export const Prop = (): any => {
  return (target: any, propName: any) => {
    function get() {
      if (!this.props) {
        this.props = {};
      }
      return this.props[propName] || this.getAttribute(propName);
    }
    function set(value: any) {
      const oldValue = this[propName];
      this.props[propName] = value;
      if(this.__connected){
        if(typeof value != 'object'){
          this.setAttribute(propName, value);
        } else {
          this.attributeChangedCallback(propName, oldValue, value);
        }
      }
    }
    Object.defineProperty(target, propName, { get, set });
  };
};