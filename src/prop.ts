import { toKebabCase } from './util';

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
          this.onAttributeChange(attrName, oldValue, value, false);
        }
        this.props[propName] = value;
      } else {
        if (!this.hasAttribute(toKebabCase(propName))) {
          this.constructor.propsInit[propName] = value;
        }
      }
    }
    if (!target.constructor.propsInit) {
      target.constructor.propsInit = {};
    }
    target.constructor.propsInit[propName] = null;
    Object.defineProperty(target, propName, { get, set });
  };
};

const getProps = (target: any) => {
  const watchAttributes = target.constructor.watchAttributes;
  const plainAttributes = {...watchAttributes};
  Object.keys(plainAttributes).forEach(v => plainAttributes[v] = '');
  const cycleProps = {...plainAttributes, ...target.constructor.propsInit};
  return Object.keys(cycleProps);
};

export const initializeProps = (target: any) => {
  const watchAttributes = target.constructor.watchAttributes;
  for (let prop of getProps(target)) {
    if (watchAttributes) {
      if(watchAttributes[toKebabCase(prop)] == null){
        watchAttributes[toKebabCase(prop)] = '';
      } else {
        const attribValue = target.props[prop] || target.getAttribute(toKebabCase(prop));
        if(typeof target[watchAttributes[prop]] == 'function'){
          target[watchAttributes[prop]]({ new: attribValue });
        }
      }
    }
    if(target.constructor.propsInit[prop]) {
      if (!target.hasAttribute(toKebabCase(prop))) {
        target[prop] = target.constructor.propsInit[prop];
      }
    }
  }
};
