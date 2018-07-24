interface ListenerMetadata {
  eventName: string;
  handler: Function;
  selector?: string;
}

interface DispatchEvent {
  emit(): void;
}

const Listen = (eventName: string, selector?: string) => {
  return (target: any, methodName: string) => {
    if (!target.constructor.listeners) {
      target.constructor.listeners = [];
    }
    target.constructor.listeners.push({ selector: selector, eventName: eventName, handler: target[methodName] });
  }
}

const addEventListeners = (target: any) => {
  if (target.constructor.listeners) {
    for (const listener of target.constructor.listeners as Array<ListenerMetadata>) {
      const eventTarget = (listener.selector) 
        ? target.shadowRoot.querySelector(listener.selector) 
          ? target.shadowRoot.querySelector(listener.selector): null  
        : this;
      if (eventTarget) {
        eventTarget.addEventListener(listener.eventName, function(e: CustomEvent){
          listener.handler.call(target, e);
        });
      }
    }
  }
}

function Dispatch(eventName: string){
  return function(target: any, propertyName: string){
    function get(){
      const self = (this as EventTarget);
      return {
        emit() {
          self.dispatchEvent(new CustomEvent(eventName));
        }
      }
    }
    Object.defineProperty(target, propertyName, { get })
  }
}

export { Listen,  addEventListeners, DispatchEvent, Dispatch, ListenerMetadata }