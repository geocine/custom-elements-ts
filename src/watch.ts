export const Watch = (attrName: string) => {
  return (target: any, propertyName: string) => {
    if (!target.constructor.watchAttributes) {
      target.constructor.watchAttributes = {};
    }
    target.constructor.watchAttributes[attrName] = propertyName;
  };
};