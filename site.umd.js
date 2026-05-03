(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Site = {}));
})(this, (function (exports) { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    const toKebabCase = (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    };
    const toCamelCase = (str) => {
        return str.toLowerCase().replace(/(-\w)/g, (m) => m[1].toUpperCase());
    };
    const tryParseInt = (value) => {
        if (typeof value === 'number' && Number.isInteger(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed !== '') {
                const parsed = Number(trimmed);
                if (Number.isInteger(parsed) && String(parsed) === trimmed) {
                    return parsed;
                }
            }
        }
        return value;
    };

    const Listen = (eventName, selector) => {
        return (target, methodName) => {
            if (!target.constructor.listeners) {
                target.constructor.listeners = [];
            }
            target.constructor.listeners.push({
                selector: selector,
                eventName: eventName,
                handler: target[methodName],
            });
        };
    };
    const addEventListeners = (target) => {
        if (target.constructor.listeners) {
            const targetRoot = target.shadowRoot || target;
            for (const listener of target.constructor.listeners) {
                let eventTarget = target;
                if (listener.selector) {
                    eventTarget = targetRoot.querySelector(listener.selector);
                }
                if (eventTarget) {
                    eventTarget.addEventListener(listener.eventName, (e) => {
                        listener.handler.call(target, e);
                    });
                }
            }
        }
    };
    const Dispatch = (eventName) => {
        return (target, propertyName) => {
            function get() {
                const self = this;
                return {
                    emit(options) {
                        const evtName = eventName ;
                        self.dispatchEvent(new CustomEvent(evtName, options));
                    },
                };
            }
            Object.defineProperty(target, propertyName, { get });
        };
    };

    const Prop = () => {
        return (target, propName) => {
            const attrName = toKebabCase(propName);
            function get() {
                const hasOwn = Object.prototype.hasOwnProperty.call(this.props, propName);
                if (hasOwn) {
                    return this.props[propName];
                }
                return this.getAttribute(attrName);
            }
            function set(value) {
                if (this.__connected) {
                    const oldValue = this.props[propName];
                    this.props[propName] = tryParseInt(value);
                    const valueType = typeof value;
                    const shouldReflect = valueType === 'string' || valueType === 'number' || valueType === 'boolean';
                    if (shouldReflect) {
                        this.setAttribute(attrName, value);
                    }
                    else {
                        this.onAttributeChange(attrName, oldValue, value, false);
                    }
                }
                else {
                    if (!this.hasAttribute(toKebabCase(propName))) {
                        this.constructor.propsInit[propName] = value;
                    }
                }
            }
            if (!target.constructor.propsInit) {
                target.constructor.propsInit = {};
            }
            target.constructor.propsInit[propName] = null;
            Object.defineProperty(target, propName, { get, set });
        };
    };
    const getProps = (target) => {
        const watchAttributes = target.constructor.watchAttributes;
        const plainAttributes = Object.assign({}, watchAttributes);
        Object.keys(plainAttributes).forEach((v) => (plainAttributes[v] = ''));
        const cycleProps = Object.assign(Object.assign({}, plainAttributes), target.constructor.propsInit);
        return Object.keys(cycleProps);
    };
    const initializeProps = (target) => {
        const watchAttributes = target.constructor.watchAttributes;
        for (const prop of getProps(target)) {
            if (watchAttributes) {
                if (watchAttributes[toKebabCase(prop)] === null ||
                    watchAttributes[toKebabCase(prop)] === undefined) {
                    watchAttributes[toKebabCase(prop)] = '';
                }
                else {
                    const hasOwn = Object.prototype.hasOwnProperty.call(target.props, prop);
                    const attribValue = hasOwn ? target.props[prop] : target.getAttribute(toKebabCase(prop));
                    if (typeof target[watchAttributes[prop]] === 'function') {
                        target[watchAttributes[prop]]({ new: attribValue });
                    }
                }
            }
            if (target.constructor.propsInit[prop]) {
                if (!target.hasAttribute(toKebabCase(prop))) {
                    target[prop] = target.constructor.propsInit[prop];
                }
            }
        }
    };

    const CustomElement = (args) => {
        return (target) => {
            const tag = args.tag || toKebabCase(target.prototype.constructor.name);
            const customElement = class extends target {
                static get observedAttributes() {
                    return Object.keys(this.propsInit || {}).map((x) => toKebabCase(x));
                }
                constructor() {
                    super();
                    this.__connected = false;
                    this.props = {};
                    this.showShadowRoot =
                        args.shadow === undefined || args.shadow === null ? true : args.shadow;
                    if (!this.shadowRoot && this.showShadowRoot) {
                        this.attachShadow({ mode: 'open' });
                    }
                }
                attributeChangedCallback(name, oldValue, newValue) {
                    this.onAttributeChange(name, oldValue, newValue);
                }
                onAttributeChange(name, oldValue, newValue, set = true) {
                    if (oldValue !== newValue) {
                        if (set) {
                            const propName = toCamelCase(name);
                            this[propName] = newValue;
                        }
                        const watchAttributes = this.constructor.watchAttributes;
                        if (watchAttributes && watchAttributes[name]) {
                            const methodToCall = watchAttributes[name];
                            if (this.__connected) {
                                if (typeof this[methodToCall] === 'function') {
                                    this[methodToCall]({ old: oldValue, new: newValue });
                                }
                            }
                        }
                    }
                }
                connectedCallback() {
                    this.__render();
                    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(this)) || null;
                    if (parentProto && typeof parentProto.connectedCallback === 'function') {
                        parentProto.connectedCallback.call(this);
                    }
                    this.__connected = true;
                    addEventListeners(this);
                    initializeProps(this);
                }
                __render() {
                    if (this.__connected)
                        return;
                    const template = document.createElement('template');
                    const style = `${args.style ? `<style>${args.style}</style>` : ''}`;
                    template.innerHTML = `${style}${args.template ? args.template : ''}`;
                    (this.showShadowRoot ? this.shadowRoot : this).appendChild(document.importNode(template.content, true));
                }
            };
            if (!customElements.get(tag)) {
                customElements.define(tag, customElement);
            }
            return customElement;
        };
    };

    exports.CodeExampleElement = class CodeExampleElement extends HTMLElement {
        constructor() {
            super();
            const code = `import { CustomElement, Prop, Listen, Dispatch, DispatchEmitter } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: '<button><slot></slot><span class="msg"></span></button>',
  styleUrl: './message.element.scss'
})
export class MessageElement extends HTMLElement {

  @Prop() message: string;

  @Dispatch('message.click') onClick: DispatchEmitter;

  @Listen('click', 'button')
  handleClick() {
    this.onClick.emit({ detail: { message: this.message } });
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.msg').textContent = this.message;
  }
}

// then, in any HTML — React, Vue, Svelte, plain — it just works:
<cts-message message="npm install custom-elements-ts"></cts-message>`;
            this.code = Prism.highlight(code, Prism.languages.javascript);
        }
        connectedCallback() {
            this.shadowRoot.querySelector('#code').innerHTML = `<pre><code>${this.code}</code></pre>`;
        }
    };
    exports.CodeExampleElement = __decorate([
        CustomElement({
            tag: 'cts-code-example',
            template: '<div id="code"></div>',
            style: `/* Lives inside <article class="window">; the chrome owns background + radius. */

:host {
  display: block;
  padding: 22px 26px 26px;
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 13.5px;
  line-height: 1.65;
  color: #d6dce5;
  background: transparent;
  overflow-x: auto;
  max-height: 520px;
  -webkit-font-smoothing: antialiased;

  @media (min-width: 980px) {
    font-size: 14px;
    padding: 28px 32px 32px;
  }

  /* Custom scrollbar so the code area doesn't ship a chunky default bar */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.10) transparent;

  &::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.10);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track { background: transparent; }
}

pre,
pre[class*="language-"] {
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  text-shadow: none;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  -moz-tab-size: 2;
  -o-tab-size: 2;
  tab-size: 2;
  hyphens: none;
  overflow: visible;
}

code,
code[class*="language-"] {
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  text-shadow: none;
  white-space: pre;
}

/* ─── Prism token theme — VS Code "Dark Modern" inspired, TS blue led ─── */

.token {
  &.comment,
  &.prolog,
  &.doctype,
  &.cdata {
    color: #6e7681;
    font-style: italic;
  }

  &.punctuation {
    color: #c9d1d9;
  }

  /* identifier-blue — properties, tags, attribute-name (e.g. tag:, template:) */
  &.property,
  &.tag,
  &.attr-name {
    color: #9cdcfe;
  }

  /* TS-blue — keywords (import, export, class, extends, new) */
  &.keyword,
  &.boolean {
    color: #4189d6;
  }

  /* teal — class names, types */
  &.class-name {
    color: #4ec9b0;
  }

  &.constant,
  &.symbol {
    color: #4189d6;
  }

  /* light green — numbers */
  &.number {
    color: #b5cea8;
  }

  /* warm muted — strings (the only "warm" color, used sparingly) */
  &.string,
  &.char,
  &.attr-value,
  &.builtin,
  &.inserted {
    color: #ce9178;
  }

  /* selectors stay muted */
  &.selector {
    color: #d7ba7d;
  }

  &.variable {
    color: #d6dce5;
  }

  &.operator,
  &.entity {
    color: #d6dce5;
  }

  &.url {
    color: #4189d6;
    text-decoration: underline;
  }

  &.atrule {
    color: #c586c0;
  }

  /* function names — soft cream so they don't fight the blues */
  &.function {
    color: #dcdcaa;
  }

  &.regex {
    color: #d16969;
  }

  &.important {
    color: #f47067;
    font-weight: 600;
  }

  &.bold { font-weight: 600; }
  &.italic { font-style: italic; }
  &.deleted { color: #f47067; }
}

.namespace { opacity: .65; }

.language-css .token.string,
.style .token.string {
  color: #ce9178;
}
`
        }),
        __metadata("design:paramtypes", [])
    ], exports.CodeExampleElement);

    exports.MessageElement = class MessageElement extends HTMLElement {
        handleClick() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                const text = (_a = this.message) !== null && _a !== void 0 ? _a : '';
                let ok = true;
                try {
                    if ((_b = navigator.clipboard) === null || _b === void 0 ? void 0 : _b.writeText) {
                        yield navigator.clipboard.writeText(text);
                    }
                    else {
                        ok = this.fallbackCopy(text);
                    }
                }
                catch (_c) {
                    ok = false;
                }
                this.toast.emit({
                    bubbles: true,
                    composed: true,
                    detail: ok
                        ? { title: 'Copied to clipboard', message: text, kind: 'success' }
                        : { title: "Couldn't copy", message: 'Copy the command manually.', kind: 'error' },
                });
            });
        }
        handleKey(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleClick();
            }
        }
        connectedCallback() {
            var _a;
            const cmd = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('.cmd');
            if (cmd)
                cmd.textContent = this.message;
        }
        fallbackCopy(text) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try {
                ok = document.execCommand('copy');
            }
            catch (_a) {
                ok = false;
            }
            document.body.removeChild(ta);
            return ok;
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", String)
    ], exports.MessageElement.prototype, "message", void 0);
    __decorate([
        Dispatch('cts:toast'),
        __metadata("design:type", Object)
    ], exports.MessageElement.prototype, "toast", void 0);
    __decorate([
        Listen('click'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], exports.MessageElement.prototype, "handleClick", null);
    __decorate([
        Listen('keydown'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [KeyboardEvent]),
        __metadata("design:returntype", void 0)
    ], exports.MessageElement.prototype, "handleKey", null);
    exports.MessageElement = __decorate([
        CustomElement({
            tag: 'cts-message',
            template: `
    <div class="row" role="button" tabindex="0" aria-label="Copy install command to clipboard">
      <span class="prompt" aria-hidden="true">$</span>
      <code class="cmd"></code>
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="1"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </span>
    </div>
  `,
            style: `:host {
  display: block;
  margin: 18px 22px 6px;
  --bg: rgba(255, 255, 255, 0.025);
  --bg-hover: rgba(255, 255, 255, 0.05);
  --line: rgba(255, 255, 255, 0.10);
  --line-hover: rgba(49, 120, 198, 0.45);
  --fg: #e6ecf3;
  --fg-prompt: #9cc0eb;
  --fg-icon: #5b6370;
  --fg-icon-hover: #9cc0eb;
}

.row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--fg);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: background 220ms cubic-bezier(0.22, 1, 0.36, 1),
              border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 140ms cubic-bezier(0.22, 1, 0.36, 1);
}

.row:hover {
  background: var(--bg-hover);
  border-color: var(--line-hover);
}

.row:active { transform: translateY(1px); }

.row:focus-visible {
  border-color: var(--line-hover);
  box-shadow: 0 0 0 2px rgba(49, 120, 198, 0.45);
}

.prompt {
  color: var(--fg-prompt);
  font-weight: 600;
  opacity: 0.95;
}

.cmd {
  font-family: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.icon {
  display: grid;
  place-items: center;
  color: var(--fg-icon);
  transition: color 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.icon svg {
  width: 14px;
  height: 14px;
  display: block;
}

.row:hover .icon { color: var(--fg-icon-hover); }
`,
        })
    ], exports.MessageElement);

    exports.ToastElement = class ToastElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.handler = (e) => this.show(e.detail);
        }
        connectedCallback() {
            document.addEventListener('cts:toast', this.handler);
        }
        disconnectedCallback() {
            document.removeEventListener('cts:toast', this.handler);
            if (this.timer)
                window.clearTimeout(this.timer);
        }
        show(detail) {
            if (!detail || !this.shadowRoot)
                return;
            const root = this.shadowRoot;
            const toast = root.querySelector('.toast');
            const titleEl = root.querySelector('.title');
            const msgEl = root.querySelector('.msg');
            titleEl.textContent = detail.title || '';
            msgEl.textContent = detail.message || '';
            toast.dataset.kind = detail.kind || 'success';
            delete toast.dataset.show;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { toast.dataset.show = ''; });
            });
            if (this.timer)
                window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => { delete toast.dataset.show; }, 2800);
        }
    };
    exports.ToastElement = __decorate([
        CustomElement({
            tag: 'cts-toast',
            template: `
    <div class="toast" role="status" aria-live="polite" aria-atomic="true">
      <span class="bar" aria-hidden="true"></span>
      <span class="icon" aria-hidden="true">
        <svg class="icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        <svg class="icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </span>
      <div class="body">
        <strong class="title"></strong>
        <span class="msg"></span>
      </div>
    </div>
  `,
            style: `:host {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  pointer-events: none;
  font-family: "Geist", "Inter", system-ui, -apple-system, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.toast {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  max-width: 380px;
  padding: 13px 18px 13px 13px;
  background: linear-gradient(180deg, #181d27 0%, #11141a 100%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 4px;
  color: #e6ecf3;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 16px 40px -16px rgba(0, 0, 0, 0.65),
    0 4px 10px -4px rgba(0, 0, 0, 0.45);

  /* Hidden state — slide up + fade in on enter */
  opacity: 0;
  transform: translateY(12px) scale(0.985);
  transition:
    opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: auto;
  will-change: transform, opacity;
}

.toast[data-show] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.bar {
  width: 3px;
  align-self: stretch;
  background: #3178c6;
  border-radius: 2px;
}
.toast[data-kind="error"] .bar { background: #f47067; }
.toast[data-kind="info"]  .bar { background: #9cc0eb; }

.icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  color: #9cc0eb;
}
.toast[data-kind="error"] .icon { color: #f47067; }

.icon svg {
  width: 16px;
  height: 16px;
  display: none;
}
.toast[data-kind="success"] .icon-success,
.toast[data-kind="info"]    .icon-success { display: block; }
.toast[data-kind="error"]   .icon-error   { display: block; }

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.title {
  font-size: 13px;
  font-weight: 600;
  color: #e6ecf3;
  letter-spacing: -0.005em;
}

.msg {
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: #97a1ad;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 540px) {
  :host {
    bottom: 16px;
    right: 16px;
    left: 16px;
  }
  .toast { max-width: none; }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: opacity 120ms linear;
    transform: none;
  }
  .toast[data-show] { transform: none; }
}
`
        })
    ], exports.ToastElement);

}));
//# sourceMappingURL=site.umd.js.map
