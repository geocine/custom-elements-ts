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
            const code = `
// Typescript
import { CustomElement, Prop, Listen } from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: '<h1></h1>'
  style: '' // css styles here or can use styleUrl
})
export class MessageElement extends HTMLElement {

  @Listen('click')
  handleClick() {
    alert('what are you waiting for?');
  }

  @Prop() message: string;

  connectedCallback(){
    this.shadowRoot.querySelector('h1').innerHTML = this.message;
  }
}

// HTML
<cts-message message="npm install custom-elements-ts"></cts-message>
        `;
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
            style: `
:host {
  font-size: 15px;
  padding: 24px;
  display: block;
  @media screen and (min-width: 1000px) {
    font-size: 17px;
    padding: 32px;
  }
  overflow-x: auto;
  color: rgb(187,187,187);
  max-height: 500px;
}

code[class*="language-"] {
  color: #c5c8c6;
  text-shadow: 0 1px rgba(0, 0, 0, 0.3);
  font-family: Inconsolata, Monaco, Consolas, "Courier New", Courier, monospace;
  direction: ltr;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  line-height: 1.5;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;
  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
}

pre {
  margin: 0;
}

pre[class*="language-"] {
  color: #c5c8c6;
  text-shadow: 0 1px rgba(0, 0, 0, 0.3);
  font-family: Inconsolata, Monaco, Consolas, "Courier New", Courier, monospace;
  direction: ltr;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  line-height: 1.5;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;
  -webkit-hyphens: none;
  -moz-hyphens: none;
  -ms-hyphens: none;
  hyphens: none;
  padding: 1em;
  overflow: auto;
  border-radius: 0.3em;
}

/* Code blocks */

:not(pre)>code[class*="language-"],
pre[class*="language-"] {
  background: #1d1f21;
}

/* Inline code */

:not(pre)>code[class*="language-"] {
  padding: .1em;
  border-radius: .3em;
}

.token {
  &.comment,
  &.prolog,
  &.doctype,
  &.cdata {
    color: #7C7C7C;
  }
  &.punctuation {
    color: #c5c8c6;
  }
}

.namespace {
  opacity: .7;
}

.token {
  &.property,
  &.keyword,
  &.tag {
    color: rgb(224, 108, 117);
  }
  &.class-name {
    color: #FFFFB6;
    text-decoration: underline;
  }
  &.boolean,
  &.constant {
    color: #99CC99;
  }
  &.symbol,
  &.deleted {
    color: #f92672;
  }
  &.number {
    color: #FF73FD;
  }
  &.selector,
  &.attr-name,
  &.string,
  &.char,
  &.builtin,
  &.inserted {
    color: #A8FF60;
  }
  &.variable {
    color: #C6C5FE;
  }
  &.operator {
    color: #EDEDED;
  }
  &.entity {
    color: #FFFFB6;
    /* text-decoration: underline; */
  }
  &.url {
    color: #96CBFE;
  }
}

.language-css .token.string,
.style .token.string {
  color: #87C38A;
}

.token {
  &.atrule,
  &.attr-value {
    color: #F9EE98;
  }
  &.function {
    color: #DAD085;
  }
  &.regex {
    color: #E9C062;
  }
  &.important {
    color: #fd971f;
    font-weight: bold;
  }
  &.bold {
    font-weight: bold;
  }
  &.italic {
    font-style: italic;
  }
  &.entity {
    cursor: help;
  }
}`
        }),
        __metadata("design:paramtypes", [])
    ], exports.CodeExampleElement);

    exports.MessageElement = class MessageElement extends HTMLElement {
        handleClick() {
            alert('what are you waiting for?');
        }
        connectedCallback() {
            this.shadowRoot.querySelector('h1').innerHTML = this.message;
        }
    };
    __decorate([
        Listen('click'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], exports.MessageElement.prototype, "handleClick", null);
    __decorate([
        Prop(),
        __metadata("design:type", String)
    ], exports.MessageElement.prototype, "message", void 0);
    exports.MessageElement = __decorate([
        CustomElement({
            tag: 'cts-message',
            template: '<h1></h1>',
            style: `
    :host {
      margin: 0 auto;
      margin-top: 50px;
      display: block;
      width: calc(100% - 50px);
      text-align: center;
      cursor: pointer;
    }
    h1 {
      font-size: 14px;
      margin: 0 auto;
      padding: 20px;
      background: #2e8edf;
      color: whitesmoke;
      border-radius: 3px;
    }
  `
        })
    ], exports.MessageElement);

}));
//# sourceMappingURL=site.umd.js.map
