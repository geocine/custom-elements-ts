export const Prop = (): any => {
  return (target: any, propName: any) => {
    function get() {
      return this.getAttribute(propName);
    }
    function set(value: any) {
      const oldValue = this[propName];
      if(this.__connected){
        if(typeof value != 'object'){
          this.setAttribute(propName, value);
        } else {
          this.attributeChangedCallback(propName, oldValue, value);
        }
      } else {
        this.constructor.propsInit[propName] = value;
      }
    }
    Object.defineProperty(target, propName, { get, set });
  };
};

export const initializeProps = (target: any) => {
  const watchAttributes = target.constructor.watchAttributes;
  if(watchAttributes) {
    for(let name of Object.keys(watchAttributes)){
      const attribValue = target.constructor.props[name] || target.getAttribute(name);
      target[watchAttributes[name]]({new: attribValue});
    }
  }
  const propsInit = target.constructor.propsInit;
  if(propsInit) {
    for(let name of Object.keys(propsInit)){
      if(!target.hasAttribute(name)){
        target[name] = propsInit[name];
      }
    }
  }
};