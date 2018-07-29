export const Prop = (): any => {
  return (target: any, propName: any) => {
    const toKebabCase = str => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    };
    const attrName = toKebabCase(propName);
    function get() {
      const getAttribute = (propName) => {
        if(this.hasAttribute(propName)){
          const attrValue = this.getAttribute(attrName);
          return attrValue == '' ? true : attrValue;
        }
        return false;
      };
      if (!this.props) {
        this.props = {};
      }
      return this.props[propName] || getAttribute(attrName);
    }
    function set(value: any) {
      const oldValue = this[propName];
      this.props[propName] = value;
      if(this.__connected){
        if(typeof value != 'object'){
          this.setAttribute(attrName, value);
        } else {
          this.attributeChangedCallback(attrName, oldValue, value);
        }
      }
    }
    Object.defineProperty(target, propName, { get, set });
  };
};