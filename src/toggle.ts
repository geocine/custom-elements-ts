import { toKebabCase } from './util';

export const Toggle = (): any => {
  return (target: any, propName: any) => {
    function get(this: any) {
      const getAttribute = (attrName: string) => {
        if (this.hasAttribute(attrName)) {
          const attrValue = this.getAttribute(attrName);
          if (/^(true|false|^$)$/.test(attrValue)) {
            return attrValue === 'true' || attrValue === '';
          } else {
            return false;
          }
        }
        return false;
      };
      return getAttribute(propName);
    }
    function set(this: any, value: any) {
      const oldValue = value;
      if (value !== null && value !== undefined) {
        switch (typeof value) {
          case 'boolean':
            break;
          case 'string':
            if (/^(true|false|^$)$/.test(value)) {
              value = oldValue === 'true' || oldValue === '';
            } else {
              console.warn(
                `TypeError: Cannot set boolean toggle property '${propName}' to '${value}'`
              );
              value = false;
            }
            break;
          default:
            throw new TypeError(`Cannot set boolean toggle property '${propName}' to '${value}'`);
        }
      }
      if (this.__connected) {
        const previous = this.props[propName];
        this.props[propName] = value || false;
        if (oldValue !== '' && oldValue !== null) {
          this.setAttribute(propName, value);
        } else {
          if (value) {
            this.setAttribute(propName, '');
          } else {
            this.removeAttribute(propName);
          }
        }
        if (!Object.is(previous, this.props[propName])) {
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
