import { toDotCase } from './util';
interface ListenerMetadata {
  eventName: string;
  handler: Function;
  selector?: string;
}

interface CustomEventOptions {
  bubbles?: true;
  detail?: any;
}

interface DispatchEmitter {
  emit(options?: CustomEventOptions): void;
}

const Listen = (eventName: string, selector?: string) => {
  return (target: any, methodName: string) => {
    if (!target.constructor.listeners) {
      target.constructor.listeners = [];
    }
    target.constructor.listeners.push({ selector: selector, eventName: eventName, handler: target[methodName] });
  };
};

const addEventListeners = (target: any) => {
  if (target.constructor.listeners) {
    for (const listener of target.constructor.listeners as Array<ListenerMetadata>) {
      const eventTarget = (listener.selector)
        ? target.shadowRoot.querySelector(listener.selector)
          ? target.shadowRoot.querySelector(listener.selector): null
        : target;
      if (eventTarget) {
        eventTarget.addEventListener(listener.eventName, (e: CustomEvent) => {
          listener.handler.call(target, e);
        });
      }
    }
  }
};

const Dispatch = (eventName?: string) =>{
  return (target: HTMLElement, propertyName: string) => {
    function get(){
      const self: EventTarget = this as EventTarget;
      return {
        emit(options?: CustomEventOptions) {
          const evtName = (eventName) ? eventName: toDotCase(propertyName);
          self.dispatchEvent(new CustomEvent(evtName, options));
        }
      };
    }
    Object.defineProperty(target, propertyName, { get });
  };
};

export { Listen,  addEventListeners, DispatchEmitter, Dispatch, CustomEventOptions, ListenerMetadata };