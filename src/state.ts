import { toKebabCase } from './util';

export interface StateMetadata {
  [key: string]: null;
}

const proxyToRaw = new WeakMap<object, object>();

export const State = (): any => {
  return (target: any, propName: string) => {
    if (!target.constructor.stateInit) {
      target.constructor.stateInit = {};
    }
    target.constructor.stateInit[propName] = null;

    function get(this: any) {
      return this.__stateValues ? this.__stateValues[propName] : undefined;
    }

    function set(this: any, value: any) {
      if (!this.__stateValues) {
        this.__stateValues = {};
      }
      if (!this.__stateProxyCaches) {
        this.__stateProxyCaches = {};
      }

      const oldValue = this.__stateValues[propName];
      const proxyCache = (this.__stateProxyCaches[propName] ||= new WeakMap<object, unknown>());
      const newValue = createStateProxy(value, proxyCache, () => {
        this.__notifyPropertyChange?.(
          propName,
          this.__stateValues[propName],
          this.__stateValues[propName]
        );
      });

      if (Object.is(oldValue, newValue)) {
        return;
      }

      this.__stateValues[propName] = newValue;
      if (this.__connected) {
        this.__notifyPropertyChange?.(propName, oldValue, newValue);
      }
    }

    Object.defineProperty(target, propName, { get, set });
  };
};

const createStateProxy = (
  value: unknown,
  cache: WeakMap<object, unknown>,
  notify: () => void
): unknown => {
  if (!isProxyable(value)) {
    return value;
  }

  if (proxyToRaw.has(value)) {
    return value;
  }

  const cached = cache.get(value);
  if (cached) {
    return cached;
  }

  const proxy = new Proxy(value, {
    get(target, property, receiver) {
      const result = Reflect.get(target, property, receiver);
      return createStateProxy(result, cache, notify);
    },
    set(target, property, nextValue, receiver) {
      const previous = Reflect.get(target, property, receiver);
      const proxiedValue = createStateProxy(nextValue, cache, notify);
      const changed = !Object.is(previous, proxiedValue);
      const didSet = Reflect.set(target, property, proxiedValue, receiver);
      if (didSet && changed) {
        notify();
      }
      return didSet;
    },
    deleteProperty(target, property) {
      const hadProperty = Object.prototype.hasOwnProperty.call(target, property);
      const deleted = Reflect.deleteProperty(target, property);
      if (deleted && hadProperty) {
        notify();
      }
      return deleted;
    },
  });

  proxyToRaw.set(proxy, value);
  cache.set(value, proxy);
  return proxy;
};

const isProxyable = (value: unknown): value is object => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (typeof Node !== 'undefined' && value instanceof Node) {
    return false;
  }
  if (
    value instanceof Date ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof WeakMap ||
    value instanceof WeakSet
  ) {
    return false;
  }
  return Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
};

export const isStateName = (target: any, propName: string): boolean => {
  return Boolean(target.constructor.stateInit?.[propName] !== undefined);
};

export const isStateAttributeName = (target: any, attrName: string): boolean => {
  const stateInit: StateMetadata | undefined = target.constructor.stateInit;
  if (!stateInit) {
    return false;
  }
  return Object.keys(stateInit).some((propName) => toKebabCase(propName) === attrName);
};
