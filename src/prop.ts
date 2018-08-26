export const Prop = (): any => {
  return (target: any, propName: any) => {
    const attrName = toKebabCase(propName);
    function get() {
      if (this.props[propName]) {
        return this.props[propName];
      }
      return this.getAttribute(attrName);
    }
    function set(value: any) {
      if (this.__connected) {
        const oldValue = this.props[propName];
        if (typeof value != 'object') {
          this.setAttribute(attrName, value);
        } else {
          this.attributeChangedCallback(attrName, oldValue, value, false);
        }
        this.props[propName] = value;
      } else {
        this.constructor.propsInit[propName] = value;
      }
    }
    Object.defineProperty(target, propName, { get, set });
  };
};

export const toKebabCase = str => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

export const initializeProps = (target: any) => {
  const watchAttributes = target.constructor.watchAttributes;
  if (watchAttributes) {
    for (let name of Object.keys(watchAttributes)) {
      const attribValue =
        target.props[name] || target.getAttribute(toKebabCase(name));
      target[watchAttributes[name]]({ new: attribValue });
    }
  }
  const propsInit = target.constructor.propsInit;
  if (propsInit) {
    for (let name of Object.keys(propsInit)) {
      if (!target.hasAttribute(name)) {
        target[name] = propsInit[name];
      }
    }
  }
};
