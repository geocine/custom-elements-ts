export const Listen = (eventName: string, selector?: string) => {
  return (target: any, methodName: string) => {
    if (!target.constructor.listeners) {
      target.constructor.listeners = [];
    }
    target.constructor.listeners.push({ selector: selector, eventName: eventName, handler: target[methodName] });
  }
}

export const addEventListeners = (target: any) => {
  if (target.constructor.listeners) {
    for (const listener of target.constructor.listeners as Array<ListenerMetadata>) {
      const eventTarget = (listener.selector) ? target.shadowRoot.querySelector(listener.selector): target;
      eventTarget.addEventListener(listener.eventName, function(e: CustomEvent){
        listener.handler.call(target, e);
      });
    }
  }
}
