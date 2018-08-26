import { toKebabCase } from './util';

export const Watch = (attrName: string) => {
  return (target: any, propertyName: string) => {
    if (!target.constructor.watchAttributes) {
      target.constructor.watchAttributes = {};
    }
    target.constructor.watchAttributes[toKebabCase(attrName)] = propertyName;
    if (!target.constructor.propsInit) {
      target.constructor.propsInit = {};
    }
    target.constructor.propsInit[attrName] = null;
  };
};