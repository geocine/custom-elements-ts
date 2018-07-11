export const Watch = (attrName: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    if (!target.constructor.watchAttributes) {
      target.constructor.watchAttributes = {};
    }
    let watchAttributes: {[key: string]: string} = target.constructor.watchAttributes;
    watchAttributes[attrName] = propertyName;
    return descriptor;
  };
};