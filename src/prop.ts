import { toKebabCase, tryParseInt } from './util';

export const Prop = (): any => {
  return (target: any, propName: any) => {
    const attrName = toKebabCase(propName);
    function get() {
      const hasOwn = Object.prototype.hasOwnProperty.call(this.props, propName);
      if (hasOwn) {
        return this.props[propName];
      }
      return this.getAttribute(attrName);
    }
    function set(value: any) {
      if (this.__connected) {
        const oldValue = this.props[propName];
        this.props[propName] = tryParseInt(value);
        const valueType = typeof value;
        const shouldReflect = valueType === 'string' || valueType === 'number' || valueType === 'boolean';
        if (shouldReflect) {
          this.setAttribute(attrName, value);
        } else {
          this.onAttributeChange(attrName, oldValue, value, false);
        }
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
        const hasOwn = Object.prototype.hasOwnProperty.call(target.props, prop);
        const attribValue = hasOwn ? target.props[prop] : target.getAttribute(toKebabCase(prop));
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
