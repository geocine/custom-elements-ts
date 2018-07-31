export const Toggle = (): any => {
  return (target: any, propName: any) => {
    function get() {
      const getAttribute = (propName) => {
        if(this.hasAttribute(propName)){
          const attrValue = this.getAttribute(propName);
          if(/^(true|false|^$)$/.test(attrValue)) {
            return attrValue == 'true' || attrValue == '';
          } else {
            return false;
          }
        }
        return false;
      };
      return getAttribute(propName);
    }
    function set(value: any) {
      const oldValue = value;
      if(value != undefined) {
        switch(typeof value){
          case 'boolean':
          break;
          case 'string':
          if(/^(true|false|^$)$/.test(value)) {
            value = oldValue == 'true' || oldValue == '';
          } else {
            console.warn(`TypeError: Cannot set boolean toggle property '${propName}' to '${value}'`);
            value = false;
          }
          break;
          default:
          throw(`TypeError: Cannot set boolean toggle property '${propName}' to '${value}'`);
        }
      }
      this.constructor.props[propName] = value || false;
      if(this.__connected){
        if(oldValue !== '' && oldValue !== null){
          this.setAttribute(propName, value);
        } else {
          if(value) {
            this.setAttribute(propName, '');
          } else {
            this.removeAttribute(propName);
          }
        }
      } else {
        this.constructor.propsInit[propName] = value || false;
      }
    }
    Object.defineProperty(target, propName, { get, set });
  };
};
