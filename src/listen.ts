export const Listen = (eventName: string) => {
  return (target: any, methodName: string) => {
    if (!target.constructor.listeners) {
      target.constructor.listeners = [];
    }
    target.constructor.listeners.push({ eventName: eventName, handler: target[methodName] });
  }
}