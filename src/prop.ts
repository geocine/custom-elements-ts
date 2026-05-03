import { toKebabCase, tryParseInt } from './util';

export const Prop = (): any => {
  return (target: any, propName: any) => {
    const attrName = toKebabCase(propName);
    function get(this: any) {
      const hasOwn = Object.prototype.hasOwnProperty.call(this.props, propName);
      if (hasOwn) {
        return this.props[propName];
      }
      return this.getAttribute(attrName);
    }
    function set(this: any, value: any) {
      if (this.__connected) {
        const oldValue = this.props[propName];
        this.props[propName] = coercePropValue(
          value,
          oldValue,
          this.constructor.propsInit[propName]
        );
        const changed = !Object.is(oldValue, this.props[propName]);
        const valueType = typeof value;
        const shouldReflect =
          valueType === 'string' || valueType === 'number' || valueType === 'boolean';
        if (shouldReflect) {
          this.setAttribute(attrName, value);
        } else {
          this.onAttributeChange(attrName, oldValue, value, false);
        }
        if (changed) {
          this.__scheduleRender?.();
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
  const plainAttributes = { ...watchAttributes };
  Object.keys(plainAttributes).forEach((v) => (plainAttributes[v] = ''));
  const cycleProps = { ...plainAttributes, ...target.constructor.propsInit };
  const stateInit = target.constructor.stateInit || {};
  return Object.keys(cycleProps).filter((prop) => stateInit[prop] === undefined);
};

export const initializeProps = (target: any) => {
  const watchAttributes = target.constructor.watchAttributes;
  for (const prop of getProps(target)) {
    const attrName = toKebabCase(prop);
    if (watchAttributes) {
      const methodName = watchAttributes[attrName];
      if (methodName === null || methodName === undefined) {
        watchAttributes[attrName] = '';
      } else {
        const hasOwn = Object.prototype.hasOwnProperty.call(target.props, prop);
        const attribValue = hasOwn ? target.props[prop] : target.getAttribute(attrName);
        if (typeof target[methodName] === 'function') {
          target[methodName]({ new: attribValue });
        }
      }
    }
    const defaultValue = target.constructor.propsInit[prop];
    if (defaultValue !== null && defaultValue !== undefined) {
      if (!target.hasAttribute(attrName)) {
        target[prop] = defaultValue;
      }
    }
  }
};

const coercePropValue = (value: any, oldValue: any, defaultValue: any): any => {
  const expectedType = typeof (oldValue === undefined ? defaultValue : oldValue);
  if (expectedType === 'boolean' && typeof value === 'string') {
    if (value === '' || value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
  }
  return tryParseInt(value);
};
