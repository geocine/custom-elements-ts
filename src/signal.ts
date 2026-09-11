export type SignalSubscriber<T> = (value: T) => void;

/**
 * Sentinel thrown by a subscriber whose DOM target has been garbage
 * collected. The notifying signal catches it and drops that subscriber, so
 * bindings clean themselves up lazily — no explicit disposal bookkeeping is
 * needed when rendered subtrees are discarded wholesale.
 */
export const signalTargetCollected: symbol = Symbol('custom-elements-ts-signal-target-collected');

/**
 * A writable reactive value. When a signal is embedded in a template
 * (`html`\`<td>${row.label}</td>\`` or `class=${row.selected}`), the render
 * part subscribes directly to it: assigning `.value` updates just that DOM
 * node, bypassing component re-rendering entirely.
 */
export class Signal<T> {
  private currentValue: T;
  private observers?: Set<SignalSubscriber<T>>;

  constructor(initialValue: T) {
    this.currentValue = initialValue;
  }

  get value(): T {
    return this.currentValue;
  }

  set value(newValue: T) {
    if (newValue === this.currentValue) {
      return;
    }
    this.currentValue = newValue;
    const observers = this.observers;
    if (!observers) {
      return;
    }
    observers.forEach((observer) => {
      try {
        observer(newValue);
      } catch (error) {
        if (error === signalTargetCollected) {
          observers.delete(observer);
          return;
        }
        throw error;
      }
    });
  }

  subscribe(observer: SignalSubscriber<T>): void {
    (this.observers || (this.observers = new Set())).add(observer);
  }

  unsubscribe(observer: SignalSubscriber<T>): void {
    this.observers?.delete(observer);
  }

  valueOf(): T {
    return this.currentValue;
  }
}

export const signal = <T>(initialValue: T): Signal<T> => new Signal(initialValue);

export const isSignal = (value: unknown): value is Signal<unknown> => value instanceof Signal;
