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
    const toDotCase = (str) => {
        return str
            .replace(/(?!^)([A-Z])/g, ' $1')
            .replace(/[_\s]+(?=[a-zA-Z])/g, '.')
            .toLowerCase();
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
                        const evtName = eventName ? eventName : toDotCase(propertyName);
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
                var _a;
                if (this.__connected) {
                    const oldValue = this.props[propName];
                    this.props[propName] = coercePropValue(value, oldValue, this.constructor.propsInit[propName]);
                    const changed = !Object.is(oldValue, this.props[propName]);
                    const valueType = typeof value;
                    const shouldReflect = valueType === 'string' || valueType === 'number' || valueType === 'boolean';
                    if (shouldReflect) {
                        this.setAttribute(attrName, value);
                    }
                    else {
                        this.onAttributeChange(attrName, oldValue, value, false);
                    }
                    if (changed) {
                        (_a = this.__scheduleRender) === null || _a === void 0 ? void 0 : _a.call(this);
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
        const stateInit = target.constructor.stateInit || {};
        return Object.keys(cycleProps).filter((prop) => stateInit[prop] === undefined);
    };
    const initializeProps = (target) => {
        const watchAttributes = target.constructor.watchAttributes;
        for (const prop of getProps(target)) {
            const attrName = toKebabCase(prop);
            if (watchAttributes) {
                const methodName = watchAttributes[attrName];
                if (methodName === null || methodName === undefined) {
                    watchAttributes[attrName] = '';
                }
                else {
                    const hasOwn = Object.prototype.hasOwnProperty.call(target.props, prop);
                    const attribValue = hasOwn ? target.props[prop] : target.getAttribute(attrName);
                    if (typeof target[methodName] === 'function') {
                        target[methodName]({ new: attribValue });
                    }
                }
            }
            const defaultValue = target.constructor.propsInit[prop];
            if (defaultValue !== null && defaultValue !== undefined) {
                if (!target.hasAttribute(attrName)) {
                    target[prop] = defaultValue;
                }
            }
        }
    };
    const coercePropValue = (value, oldValue, defaultValue) => {
        const expectedType = typeof (oldValue === undefined ? defaultValue : oldValue);
        if (expectedType === 'boolean' && typeof value === 'string') {
            if (value === '' || value === 'true') {
                return true;
            }
            if (value === 'false') {
                return false;
            }
        }
        return tryParseInt(value);
    };

    const proxyToRaw = new WeakMap();
    const State = () => {
        return (target, propName) => {
            if (!target.constructor.stateInit) {
                target.constructor.stateInit = {};
            }
            target.constructor.stateInit[propName] = null;
            function get() {
                return this.__stateValues ? this.__stateValues[propName] : undefined;
            }
            function set(value) {
                var _a;
                var _b;
                if (!this.__stateValues) {
                    this.__stateValues = {};
                }
                if (!this.__stateProxyCaches) {
                    this.__stateProxyCaches = {};
                }
                const oldValue = this.__stateValues[propName];
                const proxyCache = ((_b = this.__stateProxyCaches)[propName] || (_b[propName] = new WeakMap()));
                const newValue = createStateProxy(value, proxyCache, () => {
                    var _a;
                    (_a = this.__notifyPropertyChange) === null || _a === void 0 ? void 0 : _a.call(this, propName, this.__stateValues[propName], this.__stateValues[propName]);
                });
                if (Object.is(oldValue, newValue)) {
                    return;
                }
                this.__stateValues[propName] = newValue;
                if (this.__connected) {
                    (_a = this.__notifyPropertyChange) === null || _a === void 0 ? void 0 : _a.call(this, propName, oldValue, newValue);
                }
            }
            Object.defineProperty(target, propName, { get, set });
        };
    };
    const createStateProxy = (value, cache, notify) => {
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
    const isProxyable = (value) => {
        if (!value || typeof value !== 'object') {
            return false;
        }
        if (typeof Node !== 'undefined' && value instanceof Node) {
            return false;
        }
        if (value instanceof Date ||
            value instanceof Map ||
            value instanceof Set ||
            value instanceof WeakMap ||
            value instanceof WeakSet) {
            return false;
        }
        return Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
    };
    const isStateAttributeName = (target, attrName) => {
        const stateInit = target.constructor.stateInit;
        if (!stateInit) {
            return false;
        }
        return Object.keys(stateInit).some((propName) => toKebabCase(propName) === attrName);
    };

    const templateCache = new WeakMap();
    const html = (strings, ...values) => ({
        strings,
        values,
        __customElementsTsTemplateResult: true,
    });
    const isTemplateResult = (value) => {
        return Boolean(value &&
            typeof value === 'object' &&
            value.__customElementsTsTemplateResult === true);
    };
    const renderIntoAnchor = (value, anchor, state = {}, host) => {
        if (isTemplateResult(value)) {
            if (state.part) {
                state.part.dispose();
                state.part = undefined;
            }
            if (state.instance && state.instance.strings === value.strings) {
                state.instance.update(value.values);
                return state;
            }
            if (state.instance) {
                state.instance.dispose();
            }
            state.instance = createTemplateInstance(value, host);
            insertAfter(anchor, state.instance.nodes);
            return state;
        }
        if (state.instance) {
            state.instance.dispose();
            state.instance = undefined;
        }
        if (!state.part) {
            state.part = new ChildPart(anchor, host);
        }
        state.part.update(value);
        return state;
    };
    const createTemplateInstance = (result, host) => {
        const parsed = getParsedTemplate(result.strings);
        const template = document.createElement('template');
        template.innerHTML = parsed.html;
        const fragment = document.importNode(template.content, true);
        const parts = discoverParts(fragment, parsed.markers, host);
        const nodes = Array.from(fragment.childNodes);
        parts.forEach((part, index) => part.update(result.values[index]));
        return {
            strings: result.strings,
            nodes,
            update(values) {
                parts.forEach((part, index) => part.update(values[index]));
            },
            dispose() {
                parts.forEach((part) => part.dispose());
                nodes.forEach((node) => { var _a; return (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node); });
            },
        };
    };
    const getParsedTemplate = (strings) => {
        const cached = templateCache.get(strings);
        if (cached) {
            return cached;
        }
        const markers = [];
        let parsedHtml = '';
        for (let index = 0; index < strings.length - 1; index++) {
            parsedHtml += strings[index];
            const marker = `__custom_elements_ts_marker_${index}__`;
            markers.push(marker);
            parsedHtml += isAttributePosition(strings[index]) ? marker : `<!--${marker}-->`;
        }
        parsedHtml += strings[strings.length - 1];
        const parsed = { html: parsedHtml, markers };
        templateCache.set(strings, parsed);
        return parsed;
    };
    const isAttributePosition = (text) => {
        const lastOpen = text.lastIndexOf('<');
        const lastClose = text.lastIndexOf('>');
        if (lastOpen < lastClose) {
            return false;
        }
        return /[^\s<>"'=/]+\s*=\s*["']?$/.test(text);
    };
    const discoverParts = (fragment, markers, host) => {
        const parts = new Array(markers.length);
        const markerToIndex = new Map(markers.map((marker, index) => [marker, index]));
        const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
        let current = walker.nextNode();
        while (current) {
            if (current.nodeType === Node.COMMENT_NODE) {
                const marker = current.nodeValue || '';
                const index = markerToIndex.get(marker);
                if (index !== undefined) {
                    parts[index] = new ChildPart(current, host);
                }
            }
            else if (current.nodeType === Node.ELEMENT_NODE) {
                discoverAttributeParts(current, markerToIndex, parts, host);
            }
            current = walker.nextNode();
        }
        return parts;
    };
    const discoverAttributeParts = (element, markerToIndex, parts, host) => {
        Array.from(element.attributes).forEach((attribute) => {
            const index = markerToIndex.get(attribute.value);
            if (index === undefined) {
                return;
            }
            const name = attribute.name;
            element.removeAttribute(name);
            if (name.startsWith('@')) {
                parts[index] = new EventPart(element, name.slice(1), host);
            }
            else if (name.startsWith('.')) {
                parts[index] = new PropertyPart(element, name.slice(1));
            }
            else {
                parts[index] = new AttributePart(element, name);
            }
        });
    };
    class ChildPart {
        constructor(anchor, host) {
            this.anchor = anchor;
            this.host = host;
            this.kind = 'empty';
            this.nodes = [];
            this.arrayItems = [];
        }
        update(value) {
            const resolved = resolveValue(value);
            if (resolved === null || resolved === undefined || resolved === false) {
                this.clear();
                return;
            }
            if (Array.isArray(resolved)) {
                this.updateArray(resolved);
                return;
            }
            if (isTemplateResult(resolved)) {
                this.updateTemplate(resolved);
                return;
            }
            if (resolved instanceof Node) {
                this.updateNode(resolved);
                return;
            }
            this.updateText(String(resolved));
        }
        dispose() {
            this.clear();
        }
        clear() {
            var _a;
            (_a = this.templateInstance) === null || _a === void 0 ? void 0 : _a.dispose();
            this.templateInstance = undefined;
            this.arrayItems.forEach((item) => {
                var _a;
                item.part.dispose();
                (_a = item.anchor.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(item.anchor);
            });
            this.arrayItems = [];
            this.nodes.forEach((node) => { var _a; return (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node); });
            this.nodes = [];
            this.kind = 'empty';
        }
        updateText(value) {
            var _a;
            if (this.kind === 'text' && ((_a = this.nodes[0]) === null || _a === void 0 ? void 0 : _a.nodeType) === Node.TEXT_NODE) {
                if (this.nodes[0].nodeValue !== value) {
                    this.nodes[0].nodeValue = value;
                }
                return;
            }
            this.clear();
            const text = document.createTextNode(value);
            insertAfter(this.anchor, [text]);
            this.nodes = [text];
            this.kind = 'text';
        }
        updateNode(value) {
            if (this.kind === 'node' && this.nodes[0] === value) {
                return;
            }
            this.clear();
            insertAfter(this.anchor, [value]);
            this.nodes = [value];
            this.kind = 'node';
        }
        updateTemplate(value) {
            var _a;
            if (this.kind === 'template' && ((_a = this.templateInstance) === null || _a === void 0 ? void 0 : _a.strings) === value.strings) {
                this.templateInstance.update(value.values);
                return;
            }
            this.clear();
            this.templateInstance = createTemplateInstance(value, this.host);
            insertAfter(this.anchor, this.templateInstance.nodes);
            this.nodes = this.templateInstance.nodes;
            this.kind = 'template';
        }
        updateArray(values) {
            var _a;
            if (this.kind !== 'array') {
                this.clear();
                this.kind = 'array';
            }
            while (this.arrayItems.length > values.length) {
                const item = this.arrayItems.pop();
                item.part.dispose();
                (_a = item.anchor.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(item.anchor);
            }
            for (let index = 0; index < values.length; index++) {
                let item = this.arrayItems[index];
                if (!item) {
                    const itemAnchor = document.createComment('custom-elements-ts-array-item');
                    insertAfter(this.getEndNode(), [itemAnchor]);
                    item = {
                        anchor: itemAnchor,
                        part: new ChildPart(itemAnchor, this.host),
                    };
                    this.arrayItems[index] = item;
                }
                item.part.update(values[index]);
            }
        }
        getEndNode() {
            const lastItem = this.arrayItems[this.arrayItems.length - 1];
            if (lastItem) {
                return lastItem.part.getEndNode();
            }
            return this.nodes[this.nodes.length - 1] || this.anchor;
        }
    }
    class AttributePart {
        constructor(element, name) {
            this.element = element;
            this.name = name;
            this.currentValue = noValue;
        }
        update(value) {
            const resolved = resolveValue(value);
            if (Object.is(this.currentValue, resolved)) {
                return;
            }
            this.currentValue = resolved;
            if (resolved === false || resolved === null || resolved === undefined) {
                this.element.removeAttribute(this.name);
            }
            else {
                this.element.setAttribute(this.name, String(resolved));
            }
        }
        dispose() {
            this.currentValue = noValue;
            this.element.removeAttribute(this.name);
        }
    }
    class PropertyPart {
        constructor(element, name) {
            this.element = element;
            this.name = name;
            this.currentValue = noValue;
        }
        update(value) {
            const resolved = resolveValue(value);
            if (Object.is(this.currentValue, resolved)) {
                return;
            }
            this.currentValue = resolved;
            this.element[this.name] = resolved === null || resolved === undefined ? '' : resolved;
        }
        dispose() {
            this.currentValue = noValue;
            this.element[this.name] = '';
        }
    }
    class EventPart {
        constructor(element, eventName, host) {
            this.element = element;
            this.eventName = eventName;
            this.host = host;
            this.currentValue = noValue;
        }
        update(value) {
            if (Object.is(this.currentValue, value)) {
                return;
            }
            this.currentValue = value;
            if (this.listener) {
                this.element.removeEventListener(this.eventName, this.listener);
                this.listener = undefined;
            }
            if (typeof value === 'function') {
                const handler = value;
                this.listener = ((event) => handler.call(this.host || this.element, event));
                this.element.addEventListener(this.eventName, this.listener);
            }
            else if (isEventListenerObject(value)) {
                this.listener = value;
                this.element.addEventListener(this.eventName, this.listener);
            }
        }
        dispose() {
            this.currentValue = noValue;
            if (this.listener) {
                this.element.removeEventListener(this.eventName, this.listener);
                this.listener = undefined;
            }
        }
    }
    const resolveValue = (value) => {
        if (typeof value === 'function' && value.length === 0) {
            return value();
        }
        return value;
    };
    const isEventListenerObject = (value) => {
        return Boolean(value &&
            typeof value === 'object' &&
            typeof value.handleEvent === 'function');
    };
    const noValue = Symbol('custom-elements-ts-no-value');
    const insertAfter = (anchor, nodes) => {
        let reference = anchor.nextSibling;
        const parent = anchor.parentNode;
        if (!parent) {
            return;
        }
        nodes.forEach((node) => {
            parent.insertBefore(node, reference);
            reference = node.nextSibling;
        });
    };

    const CustomElement = (args) => {
        return (target) => {
            const tag = args.tag || toKebabCase(target.prototype.constructor.name);
            const customElement = class extends target {
                static get observedAttributes() {
                    const stateInit = this.stateInit || {};
                    return Object.keys(this.propsInit || {})
                        .filter((x) => stateInit[x] === undefined)
                        .map((x) => toKebabCase(x));
                }
                constructor() {
                    super();
                    this.__connected = false;
                    this.__hasMountedStatic = false;
                    this.__renderQueued = false;
                    this.__renderState = {};
                    this.__suppressRender = false;
                    this.props = {};
                    this.__stateValues || (this.__stateValues = {});
                    this.__stateProxyCaches || (this.__stateProxyCaches = {});
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
                        if (set && !isStateAttributeName(this, name)) {
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
                        this.__scheduleRender();
                    }
                }
                connectedCallback() {
                    if (this.__connected)
                        return;
                    this.__connected = true;
                    if (!this.__hasRender()) {
                        this.__renderStaticTemplate();
                    }
                    this.__suppressRender = true;
                    initializeProps(this);
                    this.__suppressRender = false;
                    if (this.__hasRender()) {
                        this.__mountStaticStyle();
                        this.__performRender();
                    }
                    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(this)) || null;
                    if (parentProto && typeof parentProto.connectedCallback === 'function') {
                        parentProto.connectedCallback.call(this);
                    }
                    addEventListeners(this);
                }
                disconnectedCallback() {
                    var _a, _b;
                    if (!this.__connected)
                        return;
                    this.__connected = false;
                    this.__renderQueued = false;
                    (_a = this.__renderState.instance) === null || _a === void 0 ? void 0 : _a.dispose();
                    (_b = this.__renderState.part) === null || _b === void 0 ? void 0 : _b.dispose();
                    this.__renderState = {};
                    const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(this)) || null;
                    if (parentProto && typeof parentProto.disconnectedCallback === 'function') {
                        parentProto.disconnectedCallback.call(this);
                    }
                }
                __renderStaticTemplate() {
                    if (this.__hasMountedStatic)
                        return;
                    const template = document.createElement('template');
                    const style = `${args.style ? `<style>${args.style}</style>` : ''}`;
                    template.innerHTML = `${style}${args.template ? args.template : ''}`;
                    (this.showShadowRoot ? this.shadowRoot : this).appendChild(document.importNode(template.content, true));
                    this.__hasMountedStatic = true;
                }
                __mountStaticStyle() {
                    if (this.__hasMountedStatic)
                        return;
                    if (args.style) {
                        const style = document.createElement('style');
                        style.textContent = args.style;
                        (this.showShadowRoot ? this.shadowRoot : this).appendChild(style);
                    }
                    this.__renderAnchor = document.createComment('custom-elements-ts-render');
                    (this.showShadowRoot ? this.shadowRoot : this).appendChild(this.__renderAnchor);
                    this.__hasMountedStatic = true;
                }
                __notifyPropertyChange(propName, oldValue, newValue) {
                    const watchAttributes = this.constructor.watchAttributes;
                    const watchName = toKebabCase(propName);
                    const methodToCall = watchAttributes === null || watchAttributes === void 0 ? void 0 : watchAttributes[watchName];
                    if (methodToCall && this.__connected && typeof this[methodToCall] === 'function') {
                        this[methodToCall]({ old: oldValue, new: newValue });
                    }
                    this.__scheduleRender();
                }
                __scheduleRender() {
                    if (!this.__connected || this.__suppressRender || !this.__hasRender()) {
                        return;
                    }
                    if (this.__renderQueued) {
                        return;
                    }
                    this.__renderQueued = true;
                    queueMicrotask(() => {
                        if (!this.__connected || !this.__renderQueued) {
                            return;
                        }
                        this.__performRender();
                    });
                }
                __performRender() {
                    if (!this.__hasRender()) {
                        return;
                    }
                    this.__mountStaticStyle();
                    this.__renderQueued = false;
                    try {
                        const output = this.render();
                        this.__renderState = renderIntoAnchor(output, this.__renderAnchor, this.__renderState, this);
                    }
                    finally {
                        this.__renderQueued = false;
                    }
                }
                __hasRender() {
                    return typeof this.render === 'function';
                }
            };
            if (!customElements.get(tag)) {
                customElements.define(tag, customElement);
            }
            return customElement;
        };
    };

    const Watch = (attrName) => {
        return (target, propertyName) => {
            if (!target.constructor.watchAttributes) {
                target.constructor.watchAttributes = {};
            }
            target.constructor.watchAttributes[toKebabCase(attrName)] = propertyName;
            if (!target.constructor.propsInit) {
                target.constructor.propsInit = {};
            }
            target.constructor.propsInit[attrName] = null;
        };
    };

    const Toggle = () => {
        return (target, propName) => {
            function get() {
                const getAttribute = (attrName) => {
                    if (this.hasAttribute(attrName)) {
                        const attrValue = this.getAttribute(attrName);
                        if (/^(true|false|^$)$/.test(attrValue)) {
                            return attrValue === 'true' || attrValue === '';
                        }
                        else {
                            return false;
                        }
                    }
                    return false;
                };
                return getAttribute(propName);
            }
            function set(value) {
                var _a;
                const oldValue = value;
                if (value !== null && value !== undefined) {
                    switch (typeof value) {
                        case 'boolean':
                            break;
                        case 'string':
                            if (/^(true|false|^$)$/.test(value)) {
                                value = oldValue === 'true' || oldValue === '';
                            }
                            else {
                                console.warn(`TypeError: Cannot set boolean toggle property '${propName}' to '${value}'`);
                                value = false;
                            }
                            break;
                        default:
                            throw new TypeError(`Cannot set boolean toggle property '${propName}' to '${value}'`);
                    }
                }
                if (this.__connected) {
                    const previous = this.props[propName];
                    this.props[propName] = value || false;
                    if (oldValue !== '' && oldValue !== null) {
                        this.setAttribute(propName, value);
                    }
                    else {
                        if (value) {
                            this.setAttribute(propName, '');
                        }
                        else {
                            this.removeAttribute(propName);
                        }
                    }
                    if (!Object.is(previous, this.props[propName])) {
                        (_a = this.__scheduleRender) === null || _a === void 0 ? void 0 : _a.call(this);
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

    exports.CodeExampleElement = class CodeExampleElement extends HTMLElement {
        constructor() {
            var _a;
            super();
            this.source = `import {
  CustomElement,
  Prop,
  Listen,
  Dispatch,
  DispatchEmitter,
} from 'custom-elements-ts';

@CustomElement({
  tag: 'cts-message',
  template: \`
    <div class="row" role="button" tabindex="0">
      <span class="prompt" aria-hidden="true">$</span>
      <code class="cmd"></code>
    </div>
  \`,
  styleUrl: './message.element.scss',
})
export class MessageElement extends HTMLElement {
  @Prop() message!: string;

  // Bubbling, composed CustomEvent — the host page can listen on
  // any ancestor (including <cts-toast>) without piercing shadow DOM.
  @Dispatch('cts:toast') toast!: DispatchEmitter;

  @Listen('click')
  async handleClick() {
    const ok = await this.copy(this.message);
    this.toast.emit({
      bubbles: true,
      composed: true,
      detail: ok
        ? { title: 'Copied to clipboard', message: this.message, kind: 'success' }
        : { title: "Couldn't copy", message: 'Copy manually.', kind: 'error' },
    });
  }

  connectedCallback() {
    this.shadowRoot!.querySelector('.cmd')!.textContent = this.message;
  }

  private async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

// Drop it anywhere — React, Vue, Svelte, plain HTML — it just works:
<cts-message message="npm install custom-elements-ts"></cts-message>`;
            this.code = '';
            const grammar = (_a = Prism.languages.typescript) !== null && _a !== void 0 ? _a : Prism.languages.javascript;
            this.code = Prism.highlight(this.source, grammar);
        }
        connectedCallback() {
            var _a;
            const code = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('#code');
            if (code) {
                code.innerHTML = `<pre><code>${this.code}</code></pre>`;
            }
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
`,
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
                requestAnimationFrame(() => {
                    toast.dataset.show = '';
                });
            });
            if (this.timer)
                window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                delete toast.dataset.show;
            }, 2800);
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
`,
        })
    ], exports.ToastElement);

    const MAX_ENTRIES = 6;
    exports.EventLogElement = class EventLogElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.events = '';
            this.label = 'Event log';
            this.empty = 'Interact with the component above to see events stream in.';
            this.entries = [];
            this.subscriptions = [];
            this.nextId = 1;
        }
        connectedCallback() {
            this.bind();
        }
        disconnectedCallback() {
            this.unbind();
        }
        rebind() {
            this.unbind();
            this.bind();
        }
        render() {
            const entries = this.entries;
            return html `
      <header class="head">
        <span class="dot" aria-hidden="true"></span>
        <span class="label">${this.label}</span>
        <span class="count" aria-hidden="true">${entries.length}</span>
      </header>

      ${entries.length === 0
            ? html `<p class="empty">${this.empty}</p>`
            : html `<ol class="list" aria-live="polite">
            ${entries.map((entry) => html `
                <li class="entry" data-id=${entry.id}>
                  <span class="entry-time">${entry.time}</span>
                  <span class="entry-name">${entry.name}</span>
                  <span class="entry-detail">${entry.detail}</span>
                </li>
              `)}
          </ol>`}
    `;
        }
        bind() {
            const names = this.events
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean);
            for (const name of names) {
                const handler = (event) => this.record(name, event);
                document.addEventListener(name, handler);
                this.subscriptions.push({ name, handler });
            }
        }
        unbind() {
            for (const { name, handler } of this.subscriptions) {
                document.removeEventListener(name, handler);
            }
            this.subscriptions = [];
        }
        record(name, event) {
            const entry = {
                id: this.nextId++,
                name,
                detail: this.formatDetail(event.detail),
                time: this.timestamp(),
            };
            this.entries = [entry, ...this.entries].slice(0, MAX_ENTRIES);
        }
        formatDetail(detail) {
            if (detail === null || detail === undefined)
                return '—';
            if (typeof detail === 'string')
                return detail;
            if (typeof detail === 'number' || typeof detail === 'boolean') {
                return String(detail);
            }
            try {
                return JSON.stringify(detail);
            }
            catch (_a) {
                return String(detail);
            }
        }
        timestamp() {
            const now = new Date();
            const pad = (value, size = 2) => String(value).padStart(size, '0');
            return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.EventLogElement.prototype, "events", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.EventLogElement.prototype, "label", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.EventLogElement.prototype, "empty", void 0);
    __decorate([
        State(),
        __metadata("design:type", Array)
    ], exports.EventLogElement.prototype, "entries", void 0);
    __decorate([
        Watch('events'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], exports.EventLogElement.prototype, "rebind", null);
    exports.EventLogElement = __decorate([
        CustomElement({
            tag: 'cts-event-log',
            style: `/* ─────────────────────────────────────────────────────────────
   <cts-event-log>
   Sits beside live demos on the showcase page; renders the most
   recent CustomEvents the demo has dispatched. Tokens mirror the
   site's design system (TS-blue accent, sharp 2–4px radii).
   ───────────────────────────────────────────────────────────── */

:host {
  /* Mirror the site tokens so we don't rely on inheritance through
     the shadow boundary. */
  --bg: #0a0c10;
  --bg-elev-1: #11141a;
  --bg-elev-2: #161a22;
  --line: rgba(255, 255, 255, 0.06);
  --line-strong: rgba(255, 255, 255, 0.10);
  --fg: #e6ecf3;
  --fg-muted: #97a1ad;
  --fg-subtle: #5b6370;
  --accent: #3178c6;
  --accent-bright: #4189d6;
  --accent-fg: #9cc0eb;
  --accent-soft: rgba(49, 120, 198, 0.14);
  --accent-line: rgba(49, 120, 198, 0.42);

  --radius-xs: 2px;
  --radius-sm: 2px;
  --radius-md: 3px;

  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 140ms;
  --dur: 220ms;

  display: flex;
  flex-direction: column;
  min-height: 240px;
  padding: 14px 16px 16px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background:
    radial-gradient(140% 100% at 0% 0%, rgba(49, 120, 198, 0.05) 0%, transparent 60%),
    linear-gradient(180deg, var(--bg-elev-1) 0%, #0f131b 100%);
  color: var(--fg);
  font-family: "Geist", "Inter", ui-sans-serif, system-ui, -apple-system,
               "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }

/* ── Header ─────────────────────────────────────────────── */

.head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-line);
}

.label {
  flex: 1 1 auto;
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  color: var(--accent-fg);
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ── Empty ───────────────────────────────────────────── */

.empty {
  margin: auto 0;
  padding: 12px 4px;
  color: var(--fg-subtle);
  font-size: 12.5px;
  line-height: 1.55;
  text-wrap: balance;
}

/* ── List ───────────────────────────────────────────── */

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry {
  position: relative;
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.015);
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  animation: entry-in 220ms var(--ease) both;
}

.entry::before {
  content: "";
  position: absolute;
  left: -1px;
  top: -1px;
  bottom: -1px;
  width: 2px;
  background: var(--accent);
  opacity: 0.85;
}

.entry-time {
  color: var(--fg-subtle);
  letter-spacing: 0.02em;
}

.entry-name {
  color: var(--accent-fg);
  font-weight: 500;
  white-space: nowrap;
}

.entry-detail {
  min-width: 0;
  color: var(--fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes entry-in {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry { animation: none; }
}
`,
        })
    ], exports.EventLogElement);

    const SOURCES = {
        "counter": [
            {
                "name": "counter.element.ts",
                "source": "import {\n  CustomElement,\n  Dispatch,\n  DispatchEmitter,\n  State,\n  TemplateResult,\n  Watch,\n  html,\n} from 'custom-elements-ts';\n\n@CustomElement({\n  tag: 'cts-counter',\n  styleUrl: './counter.element.scss',\n})\nexport class CounterElement extends HTMLElement {\n  @State() count = 0;\n\n  @Dispatch('counter.change') counterChange!: DispatchEmitter;\n\n  @Watch('count')\n  handleCountChange(change: { new: number }) {\n    this.counterChange.emit({\n      bubbles: true,\n      composed: true,\n      detail: {\n        count: change.new,\n      },\n    });\n  }\n\n  render(): TemplateResult {\n    const display = this.format(this.count);\n    return html`\n      <button class=\"card\" type=\"button\" @click=${this.increment}>\n        <span class=\"kicker\">\n          <span class=\"kicker-dot\"></span>\n          counter · @State()\n        </span>\n\n        <span class=\"display\" aria-live=\"polite\">\n          <span class=\"display-mute\">${display.mute}</span\n          ><span class=\"display-num\">${display.num}</span>\n        </span>\n\n        <span class=\"hint\">\n          <span class=\"hint-text\">tap anywhere to count</span>\n          <span class=\"hint-chip\">+1</span>\n        </span>\n      </button>\n    `;\n  }\n\n  private increment() {\n    this.count++;\n  }\n\n  // Pad to at least 4 digits and split into a muted lead and a bright tail\n  // so the number reads like a stopwatch — e.g. 0042, 0420, 4200, 42000.\n  private format(value: number): { mute: string; num: string } {\n    const raw = String(value);\n    const padded = raw.length >= 4 ? raw : `${'0000'.slice(raw.length)}${raw}`;\n    const tail = padded.length - raw.length;\n    return {\n      mute: padded.slice(0, tail),\n      num: padded.slice(tail),\n    };\n  }\n}\n"
            }
        ],
        "todo-dashboard": [
            {
                "name": "todo-dashboard.element.ts",
                "source": "import {\n  CustomElement,\n  Dispatch,\n  DispatchEmitter,\n  Prop,\n  State,\n  TemplateResult,\n  Toggle,\n  Watch,\n  html,\n} from 'custom-elements-ts';\n\ntype Filter = 'all' | 'active' | 'done';\n\ninterface TodoItem {\n  id: number;\n  label: string;\n  done: boolean;\n}\n\ninterface EmptyMessage {\n  title: string;\n  sub: string;\n}\n\nconst EMPTY_MESSAGES: Record<Filter, EmptyMessage> = {\n  all: {\n    title: 'Nothing on the board.',\n    sub: 'Capture a task above to start tracking work.',\n  },\n  active: {\n    title: 'All caught up.',\n    sub: 'No active tasks remain — bask in the silence.',\n  },\n  done: {\n    title: 'Nothing finished yet.',\n    sub: 'Tick a task off the list to see it surface here.',\n  },\n};\n\n@CustomElement({\n  tag: 'cts-todo-dashboard',\n  styleUrl: './todo-dashboard.element.scss',\n})\nexport class TodoDashboardElement extends HTMLElement {\n  @Prop() heading = 'Sprint board';\n  @Toggle() compact = false;\n\n  @State() draft = '';\n  @State() filter: Filter = 'all';\n  @State() goal = 5;\n  @State() revision = 0;\n  @State() items: TodoItem[] = [\n    { id: 1, label: 'Wire @CustomElement decorator', done: true },\n    { id: 2, label: 'Diff deeply nested @State() arrays', done: false },\n    { id: 3, label: 'Audit @Listen on shadow root selectors', done: false },\n  ];\n\n  @Dispatch('todo.change') todoChange!: DispatchEmitter;\n\n  private nextId = 4;\n\n  @Watch('items')\n  handleItemsChange() {\n    this.revision++;\n    this.todoChange.emit({\n      bubbles: true,\n      composed: true,\n      detail: {\n        total: this.items.length,\n        done: this.doneCount,\n        active: this.activeCount,\n      },\n    });\n  }\n\n  render(): TemplateResult {\n    const visible = this.visibleItems;\n    const total = this.items.length;\n    const done = this.doneCount;\n    const active = total - done;\n    const progress = total === 0 ? 0 : Math.round((done / total) * 100);\n\n    return html`\n      <section class=${this.compact ? 'shell compact' : 'shell'}>\n        <header class=\"header\">\n          <div class=\"title-block\">\n            <span class=\"eyebrow\">\n              <span class=\"eyebrow-dot\"></span>\n              Taskboard\n            </span>\n            <h1>${this.heading}</h1>\n            <p class=\"meta\">\n              <span><strong>${active}</strong> active</span>\n              <span class=\"dot-sep\">·</span>\n              <span><strong>${done}</strong> done</span>\n              <span class=\"dot-sep\">·</span>\n              <span><strong>${total}</strong> total</span>\n            </p>\n          </div>\n          <span class=\"revision\" title=\"State revision count\">\n            <span class=\"revision-pulse\"></span>\n            <span class=\"revision-label\">live</span>\n            <span class=\"revision-num\">r${this.padRev(this.revision)}</span>\n          </span>\n        </header>\n\n        <div class=\"progress\" aria-hidden=\"true\">\n          <span class=\"progress-fill\" style=${`--progress:${progress / 100}`}></span>\n        </div>\n\n        <cts-todo-stats\n          total=${total}\n          done=${done}\n          goal=${this.goal}\n          @goal.change=${this.handleGoalChange}\n        ></cts-todo-stats>\n\n        <div class=\"composer\">\n          <div class=\"composer-field\">\n            <span class=\"composer-icon\" aria-hidden=\"true\">${this.iconPlus()}</span>\n            <input\n              name=\"new-task\"\n              aria-label=\"New task\"\n              placeholder=\"Capture a task and press enter\"\n              .value=${this.draft}\n              @input=${this.updateDraft}\n              @keydown=${this.handleDraftKeydown}\n            />\n            <kbd aria-hidden=\"true\">Enter</kbd>\n          </div>\n          <button class=\"primary\" disabled=${!this.canAdd} @click=${this.addItem}>Add task</button>\n        </div>\n\n        <cts-todo-filters\n          filter=${this.filter}\n          total=${total}\n          active=${active}\n          done=${done}\n          @filter.change=${this.handleFilterChange}\n        ></cts-todo-filters>\n\n        ${visible.length\n          ? html`<div\n              class=\"list\"\n              role=\"list\"\n              @todo.toggle=${this.handleTodoToggle}\n              @todo.labelchange=${this.handleTodoLabelChange}\n              @todo.remove=${this.handleTodoRemove}\n            >\n              ${visible.map(\n                (item, index) => html`\n                  <cts-todo-item\n                    todoid=${item.id}\n                    label=${item.label}\n                    done=${item.done}\n                    rowindex=${index}\n                  ></cts-todo-item>\n                `\n              )}\n            </div>`\n          : this.renderEmpty()}\n\n        <footer class=\"footer\">\n          <span class=\"footer-stats\">\n            <strong>${done}</strong>\n            <span class=\"footer-divider\">/</span>\n            <span>${total}</span>\n            <span class=\"footer-label\">completed</span>\n          </span>\n          <div class=\"footer-actions\">\n            <button disabled=${total === 0} @click=${this.completeAll}>Complete all</button>\n            <button disabled=${done === 0} @click=${this.clearDone}>Clear done</button>\n          </div>\n        </footer>\n      </section>\n    `;\n  }\n\n  private renderEmpty(): TemplateResult {\n    const message = EMPTY_MESSAGES[this.filter];\n    return html`\n      <div class=\"empty\">\n        <span class=\"empty-icon\" aria-hidden=\"true\">${this.iconClipboard()}</span>\n        <p class=\"empty-title\">${message.title}</p>\n        <p class=\"empty-sub\">${message.sub}</p>\n      </div>\n    `;\n  }\n\n  // Inline SVG icons — kept tiny and reused via the template cache.\n\n  private iconPlus(): TemplateResult {\n    return html`<svg\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      stroke-width=\"2\"\n      stroke-linecap=\"round\"\n      stroke-linejoin=\"round\"\n      width=\"14\"\n      height=\"14\"\n    >\n      <path d=\"M12 5v14M5 12h14\" />\n    </svg>`;\n  }\n\n  private iconClipboard(): TemplateResult {\n    return html`<svg\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      stroke-width=\"1.5\"\n      stroke-linecap=\"round\"\n      stroke-linejoin=\"round\"\n      width=\"26\"\n      height=\"26\"\n    >\n      <path d=\"M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z\" />\n      <path d=\"M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2\" />\n      <path d=\"M9 13h6M9 17h4\" />\n    </svg>`;\n  }\n\n  // Event handlers\n\n  private updateDraft(event: Event) {\n    this.draft = (event.target as HTMLInputElement).value;\n  }\n\n  private handleDraftKeydown(event: KeyboardEvent) {\n    if (event.key === 'Enter') {\n      this.addItem();\n    }\n  }\n\n  private addItem() {\n    const label = this.draft.trim();\n    if (!label) return;\n    this.items.push({ id: this.nextId++, label, done: false });\n    this.draft = '';\n  }\n\n  private setFilter(filter: Filter) {\n    this.filter = filter;\n  }\n\n  private handleFilterChange(event: Event) {\n    this.setFilter((event as CustomEvent<{ filter: Filter }>).detail.filter);\n  }\n\n  private handleGoalChange(event: Event) {\n    this.goal = Math.max(1, (event as CustomEvent<{ goal: number }>).detail.goal);\n  }\n\n  private handleTodoToggle(event: Event) {\n    this.toggleItem((event as CustomEvent<{ id: number }>).detail.id);\n  }\n\n  private handleTodoLabelChange(event: Event) {\n    const { id, label } = (event as CustomEvent<{ id: number; label: string }>).detail;\n    this.updateItemLabel(id, label);\n  }\n\n  private handleTodoRemove(event: Event) {\n    this.removeItem((event as CustomEvent<{ id: number }>).detail.id);\n  }\n\n  private toggleItem(id: number) {\n    const item = this.items.find((entry) => entry.id === id);\n    if (item) {\n      item.done = !item.done;\n    }\n  }\n\n  private updateItemLabel(id: number, value: string) {\n    const item = this.items.find((entry) => entry.id === id);\n    if (!item) return;\n    const label = value.trim();\n    if (label) {\n      item.label = label;\n    } else {\n      this.removeItem(id);\n    }\n  }\n\n  private removeItem(id: number) {\n    const index = this.items.findIndex((entry) => entry.id === id);\n    if (index >= 0) {\n      this.items.splice(index, 1);\n    }\n  }\n\n  private completeAll() {\n    this.items.forEach((item) => {\n      item.done = true;\n    });\n  }\n\n  private clearDone() {\n    for (let index = this.items.length - 1; index >= 0; index--) {\n      if (this.items[index].done) {\n        this.items.splice(index, 1);\n      }\n    }\n  }\n\n  private padRev(value: number): string {\n    return value < 10 ? `0${value}` : String(value);\n  }\n\n  private get canAdd(): boolean {\n    return this.draft.trim().length > 0;\n  }\n\n  private get visibleItems(): TodoItem[] {\n    if (this.filter === 'active') {\n      return this.items.filter((item) => !item.done);\n    }\n    if (this.filter === 'done') {\n      return this.items.filter((item) => item.done);\n    }\n    return this.items;\n  }\n\n  private get activeCount(): number {\n    return this.items.filter((item) => !item.done).length;\n  }\n\n  private get doneCount(): number {\n    return this.items.filter((item) => item.done).length;\n  }\n}\n"
            },
            {
                "name": "todo-stats.element.ts",
                "source": "import {\n  CustomElement,\n  Dispatch,\n  DispatchEmitter,\n  Prop,\n  TemplateResult,\n  html,\n} from 'custom-elements-ts';\n\ninterface PipTrack {\n  filled: number;\n  total: number;\n  overflow: number;\n}\n\nconst MAX_PIPS = 10;\n\n@CustomElement({\n  tag: 'cts-todo-stats',\n  shadow: false,\n})\nexport class TodoStatsElement extends HTMLElement {\n  @Prop() total = 0;\n  @Prop() done = 0;\n  @Prop() goal = 5;\n\n  @Dispatch('goal.change') goalChange!: DispatchEmitter;\n\n  render(): TemplateResult {\n    const total = this.asNumber(this.total);\n    const done = this.asNumber(this.done);\n    const goal = Math.max(1, this.asNumber(this.goal));\n    const percent = total === 0 ? 0 : Math.round((done / total) * 100);\n    const remaining = Math.max(0, goal - done);\n    const overGoal = Math.max(0, done - goal);\n    const reached = done >= goal;\n    const pip = this.buildPipTrack(done, goal);\n\n    return html`\n      <aside class=\"stats-panel\">\n        ${this.renderProgressCard(total, done, percent)}\n        ${this.renderGoalCard(done, goal, remaining, overGoal, reached, pip)}\n      </aside>\n    `;\n  }\n\n  private renderProgressCard(total: number, done: number, percent: number): TemplateResult {\n    const empty = total === 0;\n    const complete = !empty && percent >= 100;\n    const className = complete\n      ? 'stat-card stat-card--progress is-complete'\n      : 'stat-card stat-card--progress';\n\n    return html`\n      <article class=${className}>\n        <header class=\"stat-head\">\n          <span class=\"stat-label\">Progress</span>\n          <span class=\"stat-tag\" data-state=${complete ? 'complete' : empty ? 'empty' : 'live'}>\n            ${complete ? 'Sprint complete' : empty ? 'No tasks yet' : 'In flight'}\n          </span>\n        </header>\n\n        <div class=\"progress-display\" aria-live=\"polite\">\n          ${empty\n            ? html`<span class=\"progress-num is-empty\">—</span>`\n            : html`<span class=\"progress-num\">${percent}</span\n                ><span class=\"progress-suffix\">%</span>`}\n        </div>\n\n        <div class=\"progress-track\" aria-hidden=\"true\">\n          <span class=\"progress-track-fill\" style=${`--p:${empty ? 0 : percent / 100}`}></span>\n        </div>\n\n        <p class=\"stat-caption\">\n          ${empty\n            ? html`Add a task above to start tracking progress.`\n            : html`<strong>${done}</strong> of <strong>${total}</strong> ${total === 1\n                  ? 'task'\n                  : 'tasks'}\n                complete`}\n        </p>\n      </article>\n    `;\n  }\n\n  private renderGoalCard(\n    done: number,\n    goal: number,\n    remaining: number,\n    overGoal: number,\n    reached: boolean,\n    pip: PipTrack\n  ): TemplateResult {\n    const className = reached ? 'stat-card stat-card--goal is-met' : 'stat-card stat-card--goal';\n\n    return html`\n      <article class=${className}>\n        <header class=\"stat-head\">\n          <span class=\"stat-label\">Sprint goal</span>\n          <div class=\"stepper\" aria-label=\"Adjust completion goal\">\n            <button\n              class=\"stepper-btn\"\n              type=\"button\"\n              aria-label=\"Decrease goal\"\n              disabled=${goal <= 1}\n              @click=${this.decreaseGoal}\n            >\n              −\n            </button>\n            <span class=\"stepper-value\" aria-hidden=\"true\">${goal}</span>\n            <button\n              class=\"stepper-btn\"\n              type=\"button\"\n              aria-label=\"Increase goal\"\n              @click=${this.increaseGoal}\n            >\n              +\n            </button>\n          </div>\n        </header>\n\n        <div\n          class=\"goal-pips\"\n          role=\"img\"\n          aria-label=${`${Math.min(done, pip.total)} of ${pip.total} goal pips filled`}\n        >\n          ${this.renderPips(pip.filled, pip.total)}\n          ${pip.overflow > 0\n            ? html`<span class=\"pip-more\" aria-hidden=\"true\">+${pip.overflow}</span>`\n            : null}\n        </div>\n\n        <p class=\"stat-caption\">\n          ${reached\n            ? html`<span class=\"goal-met\">Goal met</span>${overGoal > 0\n                  ? html`<span class=\"goal-over\">+${overGoal} bonus</span>`\n                  : null}`\n            : html`<strong>${done}</strong>/<strong>${goal}</strong>\n                <span class=\"goal-sep\">·</span>\n                <strong>${remaining}</strong> to go`}\n        </p>\n      </article>\n    `;\n  }\n\n  private renderPips(filled: number, total: number): TemplateResult[] {\n    const pips: TemplateResult[] = [];\n    for (let i = 0; i < total; i++) {\n      pips.push(html`<span class=${i < filled ? 'pip is-filled' : 'pip'}></span>`);\n    }\n    return pips;\n  }\n\n  private buildPipTrack(done: number, goal: number): PipTrack {\n    if (goal <= MAX_PIPS) {\n      return {\n        filled: Math.min(done, goal),\n        total: goal,\n        overflow: 0,\n      };\n    }\n    const filled = Math.min(MAX_PIPS, Math.round((done / goal) * MAX_PIPS));\n    return {\n      filled,\n      total: MAX_PIPS,\n      overflow: goal - MAX_PIPS,\n    };\n  }\n\n  private decreaseGoal() {\n    this.emitGoal(Math.max(1, this.asNumber(this.goal) - 1));\n  }\n\n  private increaseGoal() {\n    this.emitGoal(this.asNumber(this.goal) + 1);\n  }\n\n  private emitGoal(goal: number) {\n    this.goalChange.emit({\n      bubbles: true,\n      composed: true,\n      detail: { goal },\n    });\n  }\n\n  private asNumber(value: unknown): number {\n    return typeof value === 'number' ? value : Number(value) || 0;\n  }\n}\n"
            },
            {
                "name": "todo-filters.element.ts",
                "source": "import {\n  CustomElement,\n  Dispatch,\n  DispatchEmitter,\n  Prop,\n  TemplateResult,\n  html,\n} from 'custom-elements-ts';\n\ntype Filter = 'all' | 'active' | 'done';\n\n@CustomElement({\n  tag: 'cts-todo-filters',\n  shadow: false,\n})\nexport class TodoFiltersElement extends HTMLElement {\n  @Prop() filter: Filter = 'all';\n  @Prop() total = 0;\n  @Prop() active = 0;\n  @Prop() done = 0;\n\n  @Dispatch('filter.change') filterChange!: DispatchEmitter;\n\n  render(): TemplateResult {\n    return html`\n      <nav class=\"filters\" aria-label=\"Task filters\">\n        ${this.renderButton('all', 'All', this.total)}\n        ${this.renderButton('active', 'Active', this.active)}\n        ${this.renderButton('done', 'Done', this.done)}\n      </nav>\n    `;\n  }\n\n  private renderButton(filter: Filter, label: string, count: number): TemplateResult {\n    return html`\n      <button\n        class=\"filter\"\n        aria-pressed=${this.filter === filter}\n        @click=${() => this.setFilter(filter)}\n      >\n        <span>${label}</span>\n        <span class=\"filter-count\">${count}</span>\n      </button>\n    `;\n  }\n\n  private setFilter(filter: Filter) {\n    this.filterChange.emit({\n      bubbles: true,\n      composed: true,\n      detail: { filter },\n    });\n  }\n}\n"
            },
            {
                "name": "todo-item.element.ts",
                "source": "import {\n  CustomElement,\n  Dispatch,\n  DispatchEmitter,\n  Prop,\n  TemplateResult,\n  html,\n} from 'custom-elements-ts';\n\n@CustomElement({\n  tag: 'cts-todo-item',\n  shadow: false,\n})\nexport class TodoItemElement extends HTMLElement {\n  @Prop() todoid = 0;\n  @Prop() label = '';\n  @Prop() done: unknown = false;\n  @Prop() rowindex = 0;\n\n  @Dispatch('todo.toggle') todoToggle!: DispatchEmitter;\n  @Dispatch('todo.labelchange') todoLabelChange!: DispatchEmitter;\n  @Dispatch('todo.remove') todoRemove!: DispatchEmitter;\n\n  render(): TemplateResult {\n    const done = this.isDone;\n    return html`\n      <div class=\"row\" role=\"listitem\" data-done=${done} style=${`--index:${this.rowindex}`}>\n        <button\n          class=\"check\"\n          aria-label=${done ? 'Mark as active' : 'Mark as done'}\n          aria-pressed=${done}\n          @click=${this.toggle}\n        >\n          <span class=\"check-tick\">${this.iconCheck()}</span>\n        </button>\n        ${done\n          ? html`<span class=\"task-label is-done\">${this.label}</span>`\n          : html`<input\n              class=\"task-label\"\n              name=${`task-label-${this.todoId}`}\n              aria-label=\"Task label\"\n              .value=${this.label}\n              @change=${this.changeLabel}\n              @keydown=${this.commitEdit}\n            />`}\n        <button class=\"remove\" aria-label=\"Remove task\" @click=${this.removeTodo}>\n          ${this.iconClose()}\n        </button>\n      </div>\n    `;\n  }\n\n  private toggle() {\n    this.todoToggle.emit({\n      bubbles: true,\n      composed: true,\n      detail: { id: this.todoId },\n    });\n  }\n\n  private changeLabel(event: Event) {\n    this.todoLabelChange.emit({\n      bubbles: true,\n      composed: true,\n      detail: {\n        id: this.todoId,\n        label: (event.target as HTMLInputElement).value,\n      },\n    });\n  }\n\n  private commitEdit(event: KeyboardEvent) {\n    if (event.key === 'Enter') {\n      (event.target as HTMLInputElement).blur();\n    }\n  }\n\n  private removeTodo() {\n    this.todoRemove.emit({\n      bubbles: true,\n      composed: true,\n      detail: { id: this.todoId },\n    });\n  }\n\n  private iconCheck(): TemplateResult {\n    return html`<svg\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      stroke-width=\"3\"\n      stroke-linecap=\"round\"\n      stroke-linejoin=\"round\"\n      width=\"11\"\n      height=\"11\"\n    >\n      <path d=\"M5 12.5l4.2 4.2L19 7\" />\n    </svg>`;\n  }\n\n  private iconClose(): TemplateResult {\n    return html`<svg\n      viewBox=\"0 0 24 24\"\n      fill=\"none\"\n      stroke=\"currentColor\"\n      stroke-width=\"2\"\n      stroke-linecap=\"round\"\n      stroke-linejoin=\"round\"\n      width=\"13\"\n      height=\"13\"\n    >\n      <path d=\"M6 6l12 12M18 6L6 18\" />\n    </svg>`;\n  }\n\n  private get todoId(): number {\n    return this.asNumber(this.todoid);\n  }\n\n  private get isDone(): boolean {\n    return this.done === true || this.done === 'true';\n  }\n\n  private asNumber(value: unknown): number {\n    return typeof value === 'number' ? value : Number(value) || 0;\n  }\n}\n"
            }
        ]
    };

    exports.SourceViewerElement = class SourceViewerElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.slug = '';
            this.activeIndex = 0;
            this.files = [];
            this.highlighted = [];
            this.cachedFor = '\0';
            this.bodyNode = null;
            this.codeNode = null;
            this.renderedHtml = '';
        }
        render() {
            var _a, _b, _c;
            if (this.cachedFor !== this.slug) {
                this.recompute();
                this.cachedFor = this.slug;
            }
            if (!this.files.length) {
                return html `
        <div class="viewer">
          <p class="empty">Source unavailable for <code>${this.slug}</code>.</p>
        </div>
      `;
            }
            const showTabs = this.files.length > 1;
            const active = (_a = this.highlighted[this.activeIndex]) !== null && _a !== void 0 ? _a : '';
            if (!this.bodyNode || !this.codeNode) {
                this.codeNode = document.createElement('code');
                this.bodyNode = document.createElement('pre');
                this.bodyNode.className = 'body';
                this.bodyNode.tabIndex = 0;
                this.bodyNode.appendChild(this.codeNode);
            }
            if (this.renderedHtml !== active) {
                this.codeNode.innerHTML = active;
                this.renderedHtml = active;
            }
            return html `
      <div class="viewer">
        <div class="bar">
          <span class="kicker">
            <span class="kicker-dot" aria-hidden="true"></span>
            inline source
          </span>

          ${showTabs
            ? html `
                <div class="tabs" role="tablist" aria-label="Source files">
                  ${this.files.map((file, index) => {
                const isActive = index === this.activeIndex;
                return html `
                      <button
                        class=${isActive ? 'tab is-active' : 'tab'}
                        role="tab"
                        type="button"
                        aria-selected=${isActive ? 'true' : 'false'}
                        @click=${() => this.selectTab(index)}
                      >
                        ${file.name}
                      </button>
                    `;
            })}
                </div>
              `
            : html `<span class="single">${(_c = (_b = this.files[0]) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : ''}</span>`}
        </div>

        ${this.bodyNode}
      </div>
    `;
        }
        selectTab(index) {
            if (index === this.activeIndex)
                return;
            this.activeIndex = index;
            requestAnimationFrame(() => {
                var _a;
                const tab = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll('.tab')[index];
                tab === null || tab === void 0 ? void 0 : tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
            });
        }
        recompute() {
            var _a, _b;
            const files = (_a = SOURCES[this.slug]) !== null && _a !== void 0 ? _a : [];
            this.files = files;
            const grammar = typeof Prism !== 'undefined'
                ? ((_b = Prism.languages.typescript) !== null && _b !== void 0 ? _b : Prism.languages.javascript)
                : null;
            this.highlighted = files.map((file) => grammar ? Prism.highlight(file.source, grammar) : escapeHtml(file.source));
            if (this.activeIndex >= files.length) {
                this.activeIndex = 0;
            }
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.SourceViewerElement.prototype, "slug", void 0);
    __decorate([
        State(),
        __metadata("design:type", Object)
    ], exports.SourceViewerElement.prototype, "activeIndex", void 0);
    exports.SourceViewerElement = __decorate([
        CustomElement({
            tag: 'cts-source-viewer',
            style: `/* ─────────────────────────────────────────────────────────────
   cts-source-viewer
   Collapsible inline source panel for playground examples.
   ───────────────────────────────────────────────────────────── */

:host {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 360ms cubic-bezier(0.22, 1, 0.36, 1);
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
}

:host([open]) {
  grid-template-rows: 1fr;
}

* {
  box-sizing: border-box;
}

.viewer {
  overflow: hidden;
  min-height: 0;
  visibility: hidden;
  pointer-events: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(420px 200px at 0% 0%,
                    rgba(49, 120, 198, 0.06) 0%,
                    transparent 70%),
    linear-gradient(180deg, #0d1118 0%, #0a0d13 100%);
  transition: visibility 0s linear 360ms;
}

:host([open]) .viewer {
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}

/* ── Top bar: kicker + file tabs ─────────────────────────── */

.bar {
  display: flex;
  align-items: stretch;
  gap: 4px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  background: linear-gradient(180deg,
              rgba(255, 255, 255, 0.02) 0%,
              rgba(255, 255, 255, 0)    100%);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px 0 4px;
  margin-right: 4px;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  align-self: center;
  height: 30px;
}
.kicker-dot {
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: #4189d6;
  box-shadow: 0 0 8px rgba(65, 137, 214, 0.6);
}

.tabs {
  display: inline-flex;
  align-items: stretch;
  gap: 0;
}

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 10px 12px;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease, border-color 150ms ease, background 150ms ease;

  &:hover {
    color: rgba(255, 255, 255, 0.82);
    background: rgba(255, 255, 255, 0.02);
  }

  &:focus-visible {
    outline: 2px solid #4189d6;
    outline-offset: -2px;
    border-radius: 2px;
  }

  &.is-active {
    color: #9cc0eb;
    border-bottom-color: #4189d6;
    background: rgba(65, 137, 214, 0.04);
  }
}

.single {
  display: inline-flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #9cc0eb;
  white-space: nowrap;
}

.empty {
  margin: 0;
  padding: 16px 22px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.5);
}
.empty code {
  padding: 1px 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.025);
  color: #9cc0eb;
}

/* ── Code body ───────────────────────────────────────────── */

.body {
  margin: 0;
  padding: 22px 26px 26px;
  background: transparent;
  color: #d6dce5;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.65;
  overflow: auto;
  max-height: 460px;
  white-space: pre;
  -webkit-font-smoothing: antialiased;

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.10) transparent;

  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.10);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track { background: transparent; }

  &:focus { outline: none; }
  &:focus-visible {
    outline: 2px solid #4189d6;
    outline-offset: -2px;
  }
}

.body code {
  background: transparent;
  font-family: inherit;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
}

@media (min-width: 980px) {
  .body {
    font-size: 13.5px;
    padding: 26px 32px 30px;
    max-height: 540px;
  }
}

/* Narrow viewports: preserve tab space and hint at overflow. */
@media (max-width: 640px) {
  .bar {
    padding: 0 10px;
    mask-image: linear-gradient(to right,
                                black calc(100% - 22px),
                                transparent 100%);
    -webkit-mask-image: linear-gradient(to right,
                                        black calc(100% - 22px),
                                        transparent 100%);
  }
  .kicker {
    padding: 0 10px 0 4px;
    margin-right: 2px;
    font-size: 0; /* collapse text, keep the dot */
  }
  .tab,
  .single {
    padding: 10px 10px;
    font-size: 11.5px;
  }
  .body {
    padding: 18px 18px 22px;
    font-size: 12.5px;
    max-height: 380px;
  }
}

/* ── Prism token theme — kept in sync with cts-code-example ── */

.token {
  &.comment,
  &.prolog,
  &.doctype,
  &.cdata {
    color: #6e7681;
    font-style: italic;
  }

  &.punctuation { color: #c9d1d9; }

  &.property,
  &.tag,
  &.attr-name { color: #9cdcfe; }

  &.keyword,
  &.boolean { color: #4189d6; }

  &.class-name { color: #4ec9b0; }

  &.constant,
  &.symbol { color: #4189d6; }

  &.number { color: #b5cea8; }

  &.string,
  &.char,
  &.attr-value,
  &.builtin,
  &.inserted { color: #ce9178; }

  &.selector { color: #d7ba7d; }

  &.variable { color: #d6dce5; }

  &.operator,
  &.entity { color: #d6dce5; }

  &.url {
    color: #4189d6;
    text-decoration: underline;
  }

  &.atrule { color: #c586c0; }

  &.function { color: #dcdcaa; }

  &.regex { color: #d16969; }

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

@media (prefers-reduced-motion: reduce) {
  :host { transition: none; }
}
`,
        })
    ], exports.SourceViewerElement);
    const ENTITY_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
    };
    function escapeHtml(value) {
        return value.replace(/[&<>]/g, (char) => { var _a; return (_a = ENTITY_MAP[char]) !== null && _a !== void 0 ? _a : char; });
    }

    const TOGGLE_ATTR = 'data-source-toggle';
    const TARGET_ATTR = 'data-source-target';
    const OPEN_ATTR = 'open';
    const ACTIVE_CLASS = 'is-active';
    const SCROLL_OFFSET = 88;
    function prefersReducedMotion() {
        return (typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function scrollPanelIntoView(panel) {
        requestAnimationFrame(() => {
            const top = panel.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
            if (top <= window.scrollY)
                return;
            window.scrollTo({
                top,
                behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            });
        });
    }
    function findToggle(target) {
        if (!(target instanceof Element))
            return null;
        return target.closest(`[${TOGGLE_ATTR}]`);
    }
    function syncTrigger(trigger, isOpen) {
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trigger.classList.toggle(ACTIVE_CLASS, isOpen);
    }
    function handleClick(event) {
        const trigger = findToggle(event.target);
        if (!trigger)
            return;
        const targetId = trigger.getAttribute(TARGET_ATTR);
        if (!targetId)
            return;
        const panel = document.getElementById(targetId);
        if (!panel)
            return;
        event.preventDefault();
        const willOpen = !panel.hasAttribute(OPEN_ATTR);
        if (willOpen) {
            panel.setAttribute(OPEN_ATTR, '');
        }
        else {
            panel.removeAttribute(OPEN_ATTR);
        }
        syncTrigger(trigger, willOpen);
        if (willOpen) {
            scrollPanelIntoView(panel);
        }
    }
    function init() {
        document.querySelectorAll(`[${TOGGLE_ATTR}]`).forEach((trigger) => {
            const targetId = trigger.getAttribute(TARGET_ATTR);
            if (!targetId)
                return;
            const panel = document.getElementById(targetId);
            if (!panel)
                return;
            syncTrigger(trigger, panel.hasAttribute(OPEN_ATTR));
        });
        document.addEventListener('click', handleClick);
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        }
        else {
            init();
        }
    }

    function scrollToHashTarget() {
        const id = decodeURIComponent(window.location.hash.slice(1));
        const target = id ? document.getElementById(id) : null;
        if (!target)
            return false;
        target.scrollIntoView();
        return true;
    }
    function syncInitialScroll() {
        if (typeof window === 'undefined')
            return;
        if (window.location.hash) {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'auto';
            }
            requestAnimationFrame(scrollToHashTarget);
            return;
        }
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    syncInitialScroll();
    window.addEventListener('pageshow', syncInitialScroll);

    exports.CounterElement = class CounterElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.count = 0;
        }
        handleCountChange(change) {
            this.counterChange.emit({
                bubbles: true,
                composed: true,
                detail: {
                    count: change.new,
                },
            });
        }
        render() {
            const display = this.format(this.count);
            return html `
      <button class="card" type="button" @click=${this.increment}>
        <span class="kicker">
          <span class="kicker-dot"></span>
          counter · @State()
        </span>

        <span class="display" aria-live="polite">
          <span class="display-mute">${display.mute}</span
          ><span class="display-num">${display.num}</span>
        </span>

        <span class="hint">
          <span class="hint-text">tap anywhere to count</span>
          <span class="hint-chip">+1</span>
        </span>
      </button>
    `;
        }
        increment() {
            this.count++;
        }
        format(value) {
            const raw = String(value);
            const padded = raw.length >= 4 ? raw : `${'0000'.slice(raw.length)}${raw}`;
            const tail = padded.length - raw.length;
            return {
                mute: padded.slice(0, tail),
                num: padded.slice(tail),
            };
        }
    };
    __decorate([
        State(),
        __metadata("design:type", Object)
    ], exports.CounterElement.prototype, "count", void 0);
    __decorate([
        Dispatch('counter.change'),
        __metadata("design:type", Object)
    ], exports.CounterElement.prototype, "counterChange", void 0);
    __decorate([
        Watch('count'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], exports.CounterElement.prototype, "handleCountChange", null);
    exports.CounterElement = __decorate([
        CustomElement({
            tag: 'cts-counter',
            style: `/* ─────────────────────────────────────────────────────────────
   cts-counter
   A single-button card showcasing @State(). Sharp radii, Geist
   typography, TS-blue accent. Aligned with demos/site tokens.
   ───────────────────────────────────────────────────────────── */

:host {
  --bg:            #0a0c10;
  --bg-elev-1:     #11141a;
  --line:          rgba(255, 255, 255, 0.06);
  --line-strong:   rgba(255, 255, 255, 0.10);
  --fg:            #e6ecf3;
  --fg-muted:      #97a1ad;
  --fg-subtle:     #5b6370;
  --accent:        #3178c6;
  --accent-bright: #4189d6;
  --accent-fg:     #9cc0eb;
  --accent-soft:   rgba(49, 120, 198, 0.14);
  --accent-line:   rgba(49, 120, 198, 0.42);

  --radius-xs: 2px;
  --radius-sm: 2px;
  --radius-md: 3px;
  --radius-lg: 4px;

  --ease:     cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 140ms;
  --dur:      220ms;

  display: inline-block;
  color: var(--fg);
  font-family:
    "Geist", "Inter", ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

/* ── Card button ─────────────────────────────────────────── */

.card {
  position: relative;
  display: grid;
  gap: 18px;
  width: 320px;
  padding: 22px 24px 22px;
  margin: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(120% 100% at 0% 0%, rgba(49, 120, 198, 0.07) 0%, transparent 55%),
    linear-gradient(180deg, var(--bg-elev-1) 0%, #0f131b 100%);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 22px 50px -28px rgba(0, 0, 0, 0.65),
    0 8px 24px -12px rgba(0, 0, 0, 0.45);
  transition:
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
  animation: card-in 520ms var(--ease) both;
}

.card::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent-line) 30%,
    var(--accent-bright) 50%,
    var(--accent-line) 70%,
    transparent 100%
  );
  opacity: 0;
  transform: translateX(-30%);
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur-slow, 420ms) var(--ease);
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.18);
}

.card:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.card:focus-visible {
  outline: none;
  border-color: var(--accent-line);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 0 0 3px var(--accent-soft),
    0 22px 50px -28px rgba(0, 0, 0, 0.65);
}

.card:active {
  transform: translateY(1px);
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Kicker ──────────────────────────────────────────────── */

.kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--fg-muted);
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.kicker-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-line);
}

/* ── Display ─────────────────────────────────────────────── */

.display {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 76px;
  font-weight: 600;
  line-height: 0.95;
  letter-spacing: -0.045em;
  font-variant-numeric: tabular-nums;
}

.display-mute {
  color: var(--fg-subtle);
  opacity: 0.35;
}

.display-num {
  color: var(--fg);
  background: linear-gradient(180deg, var(--fg) 0%, #c8d3e0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ── Hint row ────────────────────────────────────────────── */

.hint {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--fg-muted);
  font-size: 12px;
  letter-spacing: -0.005em;
}

.hint-text {
  color: var(--fg-muted);
}

.hint-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  color: var(--accent-fg);
  font-family: "Geist Mono", "JetBrains Mono", ui-monospace, SFMono-Regular,
               Menlo, Consolas, "Courier New", monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition:
    border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.card:hover .hint-chip {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  transform: translateY(-1px);
}

.card:active .hint-chip {
  transform: translateY(0);
}

/* ── Responsive ──────────────────────────────────────────── */

@media (max-width: 380px) {
  .card { width: 100%; }
  .display { font-size: 64px; }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card::before,
  .hint-chip {
    animation: none;
    transition: none;
  }
}
`,
        })
    ], exports.CounterElement);

    const MAX_PIPS = 10;
    exports.TodoStatsElement = class TodoStatsElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.total = 0;
            this.done = 0;
            this.goal = 5;
        }
        render() {
            const total = this.asNumber(this.total);
            const done = this.asNumber(this.done);
            const goal = Math.max(1, this.asNumber(this.goal));
            const percent = total === 0 ? 0 : Math.round((done / total) * 100);
            const remaining = Math.max(0, goal - done);
            const overGoal = Math.max(0, done - goal);
            const reached = done >= goal;
            const pip = this.buildPipTrack(done, goal);
            return html `
      <aside class="stats-panel">
        ${this.renderProgressCard(total, done, percent)}
        ${this.renderGoalCard(done, goal, remaining, overGoal, reached, pip)}
      </aside>
    `;
        }
        renderProgressCard(total, done, percent) {
            const empty = total === 0;
            const complete = !empty && percent >= 100;
            const className = complete
                ? 'stat-card stat-card--progress is-complete'
                : 'stat-card stat-card--progress';
            return html `
      <article class=${className}>
        <header class="stat-head">
          <span class="stat-label">Progress</span>
          <span class="stat-tag" data-state=${complete ? 'complete' : empty ? 'empty' : 'live'}>
            ${complete ? 'Sprint complete' : empty ? 'No tasks yet' : 'In flight'}
          </span>
        </header>

        <div class="progress-display" aria-live="polite">
          ${empty
            ? html `<span class="progress-num is-empty">—</span>`
            : html `<span class="progress-num">${percent}</span
                ><span class="progress-suffix">%</span>`}
        </div>

        <div class="progress-track" aria-hidden="true">
          <span class="progress-track-fill" style=${`--p:${empty ? 0 : percent / 100}`}></span>
        </div>

        <p class="stat-caption">
          ${empty
            ? html `Add a task above to start tracking progress.`
            : html `<strong>${done}</strong> of <strong>${total}</strong> ${total === 1
                ? 'task'
                : 'tasks'}
                complete`}
        </p>
      </article>
    `;
        }
        renderGoalCard(done, goal, remaining, overGoal, reached, pip) {
            const className = reached ? 'stat-card stat-card--goal is-met' : 'stat-card stat-card--goal';
            return html `
      <article class=${className}>
        <header class="stat-head">
          <span class="stat-label">Sprint goal</span>
          <div class="stepper" aria-label="Adjust completion goal">
            <button
              class="stepper-btn"
              type="button"
              aria-label="Decrease goal"
              disabled=${goal <= 1}
              @click=${this.decreaseGoal}
            >
              −
            </button>
            <span class="stepper-value" aria-hidden="true">${goal}</span>
            <button
              class="stepper-btn"
              type="button"
              aria-label="Increase goal"
              @click=${this.increaseGoal}
            >
              +
            </button>
          </div>
        </header>

        <div
          class="goal-pips"
          role="img"
          aria-label=${`${Math.min(done, pip.total)} of ${pip.total} goal pips filled`}
        >
          ${this.renderPips(pip.filled, pip.total)}
          ${pip.overflow > 0
            ? html `<span class="pip-more" aria-hidden="true">+${pip.overflow}</span>`
            : null}
        </div>

        <p class="stat-caption">
          ${reached
            ? html `<span class="goal-met">Goal met</span>${overGoal > 0
                ? html `<span class="goal-over">+${overGoal} bonus</span>`
                : null}`
            : html `<strong>${done}</strong>/<strong>${goal}</strong>
                <span class="goal-sep">·</span>
                <strong>${remaining}</strong> to go`}
        </p>
      </article>
    `;
        }
        renderPips(filled, total) {
            const pips = [];
            for (let i = 0; i < total; i++) {
                pips.push(html `<span class=${i < filled ? 'pip is-filled' : 'pip'}></span>`);
            }
            return pips;
        }
        buildPipTrack(done, goal) {
            if (goal <= MAX_PIPS) {
                return {
                    filled: Math.min(done, goal),
                    total: goal,
                    overflow: 0,
                };
            }
            const filled = Math.min(MAX_PIPS, Math.round((done / goal) * MAX_PIPS));
            return {
                filled,
                total: MAX_PIPS,
                overflow: goal - MAX_PIPS,
            };
        }
        decreaseGoal() {
            this.emitGoal(Math.max(1, this.asNumber(this.goal) - 1));
        }
        increaseGoal() {
            this.emitGoal(this.asNumber(this.goal) + 1);
        }
        emitGoal(goal) {
            this.goalChange.emit({
                bubbles: true,
                composed: true,
                detail: { goal },
            });
        }
        asNumber(value) {
            return typeof value === 'number' ? value : Number(value) || 0;
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoStatsElement.prototype, "total", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoStatsElement.prototype, "done", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoStatsElement.prototype, "goal", void 0);
    __decorate([
        Dispatch('goal.change'),
        __metadata("design:type", Object)
    ], exports.TodoStatsElement.prototype, "goalChange", void 0);
    exports.TodoStatsElement = __decorate([
        CustomElement({
            tag: 'cts-todo-stats',
            shadow: false,
        })
    ], exports.TodoStatsElement);

    exports.TodoFiltersElement = class TodoFiltersElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.filter = 'all';
            this.total = 0;
            this.active = 0;
            this.done = 0;
        }
        render() {
            return html `
      <nav class="filters" aria-label="Task filters">
        ${this.renderButton('all', 'All', this.total)}
        ${this.renderButton('active', 'Active', this.active)}
        ${this.renderButton('done', 'Done', this.done)}
      </nav>
    `;
        }
        renderButton(filter, label, count) {
            return html `
      <button
        class="filter"
        aria-pressed=${this.filter === filter}
        @click=${() => this.setFilter(filter)}
      >
        <span>${label}</span>
        <span class="filter-count">${count}</span>
      </button>
    `;
        }
        setFilter(filter) {
            this.filterChange.emit({
                bubbles: true,
                composed: true,
                detail: { filter },
            });
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", String)
    ], exports.TodoFiltersElement.prototype, "filter", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoFiltersElement.prototype, "total", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoFiltersElement.prototype, "active", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoFiltersElement.prototype, "done", void 0);
    __decorate([
        Dispatch('filter.change'),
        __metadata("design:type", Object)
    ], exports.TodoFiltersElement.prototype, "filterChange", void 0);
    exports.TodoFiltersElement = __decorate([
        CustomElement({
            tag: 'cts-todo-filters',
            shadow: false,
        })
    ], exports.TodoFiltersElement);

    exports.TodoItemElement = class TodoItemElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.todoid = 0;
            this.label = '';
            this.done = false;
            this.rowindex = 0;
        }
        render() {
            const done = this.isDone;
            return html `
      <div class="row" role="listitem" data-done=${done} style=${`--index:${this.rowindex}`}>
        <button
          class="check"
          aria-label=${done ? 'Mark as active' : 'Mark as done'}
          aria-pressed=${done}
          @click=${this.toggle}
        >
          <span class="check-tick">${this.iconCheck()}</span>
        </button>
        ${done
            ? html `<span class="task-label is-done">${this.label}</span>`
            : html `<input
              class="task-label"
              name=${`task-label-${this.todoId}`}
              aria-label="Task label"
              .value=${this.label}
              @change=${this.changeLabel}
              @keydown=${this.commitEdit}
            />`}
        <button class="remove" aria-label="Remove task" @click=${this.removeTodo}>
          ${this.iconClose()}
        </button>
      </div>
    `;
        }
        toggle() {
            this.todoToggle.emit({
                bubbles: true,
                composed: true,
                detail: { id: this.todoId },
            });
        }
        changeLabel(event) {
            this.todoLabelChange.emit({
                bubbles: true,
                composed: true,
                detail: {
                    id: this.todoId,
                    label: event.target.value,
                },
            });
        }
        commitEdit(event) {
            if (event.key === 'Enter') {
                event.target.blur();
            }
        }
        removeTodo() {
            this.todoRemove.emit({
                bubbles: true,
                composed: true,
                detail: { id: this.todoId },
            });
        }
        iconCheck() {
            return html `<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="11"
      height="11"
    >
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>`;
        }
        iconClose() {
            return html `<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="13"
      height="13"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>`;
        }
        get todoId() {
            return this.asNumber(this.todoid);
        }
        get isDone() {
            return this.done === true || this.done === 'true';
        }
        asNumber(value) {
            return typeof value === 'number' ? value : Number(value) || 0;
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "todoid", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "label", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "done", void 0);
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "rowindex", void 0);
    __decorate([
        Dispatch('todo.toggle'),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "todoToggle", void 0);
    __decorate([
        Dispatch('todo.labelchange'),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "todoLabelChange", void 0);
    __decorate([
        Dispatch('todo.remove'),
        __metadata("design:type", Object)
    ], exports.TodoItemElement.prototype, "todoRemove", void 0);
    exports.TodoItemElement = __decorate([
        CustomElement({
            tag: 'cts-todo-item',
            shadow: false,
        })
    ], exports.TodoItemElement);

    const EMPTY_MESSAGES = {
        all: {
            title: 'Nothing on the board.',
            sub: 'Capture a task above to start tracking work.',
        },
        active: {
            title: 'All caught up.',
            sub: 'No active tasks remain — bask in the silence.',
        },
        done: {
            title: 'Nothing finished yet.',
            sub: 'Tick a task off the list to see it surface here.',
        },
    };
    exports.TodoDashboardElement = class TodoDashboardElement extends HTMLElement {
        constructor() {
            super(...arguments);
            this.heading = 'Sprint board';
            this.compact = false;
            this.draft = '';
            this.filter = 'all';
            this.goal = 5;
            this.revision = 0;
            this.items = [
                { id: 1, label: 'Wire @CustomElement decorator', done: true },
                { id: 2, label: 'Diff deeply nested @State() arrays', done: false },
                { id: 3, label: 'Audit @Listen on shadow root selectors', done: false },
            ];
            this.nextId = 4;
        }
        handleItemsChange() {
            this.revision++;
            this.todoChange.emit({
                bubbles: true,
                composed: true,
                detail: {
                    total: this.items.length,
                    done: this.doneCount,
                    active: this.activeCount,
                },
            });
        }
        render() {
            const visible = this.visibleItems;
            const total = this.items.length;
            const done = this.doneCount;
            const active = total - done;
            const progress = total === 0 ? 0 : Math.round((done / total) * 100);
            return html `
      <section class=${this.compact ? 'shell compact' : 'shell'}>
        <header class="header">
          <div class="title-block">
            <span class="eyebrow">
              <span class="eyebrow-dot"></span>
              Taskboard
            </span>
            <h1>${this.heading}</h1>
            <p class="meta">
              <span><strong>${active}</strong> active</span>
              <span class="dot-sep">·</span>
              <span><strong>${done}</strong> done</span>
              <span class="dot-sep">·</span>
              <span><strong>${total}</strong> total</span>
            </p>
          </div>
          <span class="revision" title="State revision count">
            <span class="revision-pulse"></span>
            <span class="revision-label">live</span>
            <span class="revision-num">r${this.padRev(this.revision)}</span>
          </span>
        </header>

        <div class="progress" aria-hidden="true">
          <span class="progress-fill" style=${`--progress:${progress / 100}`}></span>
        </div>

        <cts-todo-stats
          total=${total}
          done=${done}
          goal=${this.goal}
          @goal.change=${this.handleGoalChange}
        ></cts-todo-stats>

        <div class="composer">
          <div class="composer-field">
            <span class="composer-icon" aria-hidden="true">${this.iconPlus()}</span>
            <input
              name="new-task"
              aria-label="New task"
              placeholder="Capture a task and press enter"
              .value=${this.draft}
              @input=${this.updateDraft}
              @keydown=${this.handleDraftKeydown}
            />
            <kbd aria-hidden="true">Enter</kbd>
          </div>
          <button class="primary" disabled=${!this.canAdd} @click=${this.addItem}>Add task</button>
        </div>

        <cts-todo-filters
          filter=${this.filter}
          total=${total}
          active=${active}
          done=${done}
          @filter.change=${this.handleFilterChange}
        ></cts-todo-filters>

        ${visible.length
            ? html `<div
              class="list"
              role="list"
              @todo.toggle=${this.handleTodoToggle}
              @todo.labelchange=${this.handleTodoLabelChange}
              @todo.remove=${this.handleTodoRemove}
            >
              ${visible.map((item, index) => html `
                  <cts-todo-item
                    todoid=${item.id}
                    label=${item.label}
                    done=${item.done}
                    rowindex=${index}
                  ></cts-todo-item>
                `)}
            </div>`
            : this.renderEmpty()}

        <footer class="footer">
          <span class="footer-stats">
            <strong>${done}</strong>
            <span class="footer-divider">/</span>
            <span>${total}</span>
            <span class="footer-label">completed</span>
          </span>
          <div class="footer-actions">
            <button disabled=${total === 0} @click=${this.completeAll}>Complete all</button>
            <button disabled=${done === 0} @click=${this.clearDone}>Clear done</button>
          </div>
        </footer>
      </section>
    `;
        }
        renderEmpty() {
            const message = EMPTY_MESSAGES[this.filter];
            return html `
      <div class="empty">
        <span class="empty-icon" aria-hidden="true">${this.iconClipboard()}</span>
        <p class="empty-title">${message.title}</p>
        <p class="empty-sub">${message.sub}</p>
      </div>
    `;
        }
        iconPlus() {
            return html `<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="14"
      height="14"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>`;
        }
        iconClipboard() {
            return html `<svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      width="26"
      height="26"
    >
      <path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z" />
      <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M9 13h6M9 17h4" />
    </svg>`;
        }
        updateDraft(event) {
            this.draft = event.target.value;
        }
        handleDraftKeydown(event) {
            if (event.key === 'Enter') {
                this.addItem();
            }
        }
        addItem() {
            const label = this.draft.trim();
            if (!label)
                return;
            this.items.push({ id: this.nextId++, label, done: false });
            this.draft = '';
        }
        setFilter(filter) {
            this.filter = filter;
        }
        handleFilterChange(event) {
            this.setFilter(event.detail.filter);
        }
        handleGoalChange(event) {
            this.goal = Math.max(1, event.detail.goal);
        }
        handleTodoToggle(event) {
            this.toggleItem(event.detail.id);
        }
        handleTodoLabelChange(event) {
            const { id, label } = event.detail;
            this.updateItemLabel(id, label);
        }
        handleTodoRemove(event) {
            this.removeItem(event.detail.id);
        }
        toggleItem(id) {
            const item = this.items.find((entry) => entry.id === id);
            if (item) {
                item.done = !item.done;
            }
        }
        updateItemLabel(id, value) {
            const item = this.items.find((entry) => entry.id === id);
            if (!item)
                return;
            const label = value.trim();
            if (label) {
                item.label = label;
            }
            else {
                this.removeItem(id);
            }
        }
        removeItem(id) {
            const index = this.items.findIndex((entry) => entry.id === id);
            if (index >= 0) {
                this.items.splice(index, 1);
            }
        }
        completeAll() {
            this.items.forEach((item) => {
                item.done = true;
            });
        }
        clearDone() {
            for (let index = this.items.length - 1; index >= 0; index--) {
                if (this.items[index].done) {
                    this.items.splice(index, 1);
                }
            }
        }
        padRev(value) {
            return value < 10 ? `0${value}` : String(value);
        }
        get canAdd() {
            return this.draft.trim().length > 0;
        }
        get visibleItems() {
            if (this.filter === 'active') {
                return this.items.filter((item) => !item.done);
            }
            if (this.filter === 'done') {
                return this.items.filter((item) => item.done);
            }
            return this.items;
        }
        get activeCount() {
            return this.items.filter((item) => !item.done).length;
        }
        get doneCount() {
            return this.items.filter((item) => item.done).length;
        }
    };
    __decorate([
        Prop(),
        __metadata("design:type", Object)
    ], exports.TodoDashboardElement.prototype, "heading", void 0);
    __decorate([
        Toggle(),
        __metadata("design:type", Object)
    ], exports.TodoDashboardElement.prototype, "compact", void 0);
    __decorate([
        State(),
        __metadata("design:type", Object)
    ], exports.TodoDashboardElement.prototype, "draft", void 0);
    __decorate([
        State(),
        __metadata("design:type", String)
    ], exports.TodoDashboardElement.prototype, "filter", void 0);
    __decorate([
        State(),
        __metadata("design:type", Object)
    ], exports.TodoDashboardElement.prototype, "goal", void 0);
    __decorate([
        State(),
        __metadata("design:type", Object)
    ], exports.TodoDashboardElement.prototype, "revision", void 0);
    __decorate([
        State(),
        __metadata("design:type", Array)
    ], exports.TodoDashboardElement.prototype, "items", void 0);
    __decorate([
        Dispatch('todo.change'),
        __metadata("design:type", Object)
    ], exports.TodoDashboardElement.prototype, "todoChange", void 0);
    __decorate([
        Watch('items'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], exports.TodoDashboardElement.prototype, "handleItemsChange", null);
    exports.TodoDashboardElement = __decorate([
        CustomElement({
            tag: 'cts-todo-dashboard',
            style: `/* ─────────────────────────────────────────────────────────────
   cts-todo-dashboard
   Dark, technical surface aligned with demos/site tokens.
   Sharp radii (2–4px), Geist typography, single TS-blue accent.
   ───────────────────────────────────────────────────────────── */

:host {
  /* Surfaces */
  --bg: #0a0c10;
  --bg-elev-1: #11141a;
  --bg-elev-2: #161a22;
  --bg-elev-3: #1c2230;

  /* Lines */
  --line: rgba(255, 255, 255, 0.06);
  --line-strong: rgba(255, 255, 255, 0.1);
  --line-accent: rgba(49, 120, 198, 0.32);

  /* Type */
  --fg: #e6ecf3;
  --fg-muted: #97a1ad;
  --fg-subtle: #5b6370;

  /* Accent — TypeScript brand blue. One color, used sparingly. */
  --accent: #3178c6;
  --accent-bright: #4189d6;
  --accent-fg: #9cc0eb;
  --accent-soft: rgba(49, 120, 198, 0.14);
  --accent-line: rgba(49, 120, 198, 0.42);

  /* Status — kept neutral except for destructive remove */
  --ok: #6fcf97;
  --ok-soft: rgba(111, 207, 151, 0.18);
  --danger: #c46a6a;
  --danger-soft: rgba(196, 106, 106, 0.1);

  /* Radii — sharp, technical, editorial. */
  --radius-xs: 2px;
  --radius-sm: 2px;
  --radius-md: 3px;
  --radius-lg: 4px;

  /* Motion */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 140ms;
  --dur: 220ms;
  --dur-slow: 420ms;

  display: block;
  width: min(720px, 100%);
  color: var(--fg);
  font-family:
    'Geist',
    'Inter',
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

/* ── Shell ───────────────────────────────────────────────── */

.shell {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(49, 120, 198, 0.06) 0%, transparent 55%),
    linear-gradient(180deg, var(--bg-elev-1) 0%, #0f131b 100%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 22px 50px -28px rgba(0, 0, 0, 0.65),
    0 8px 24px -12px rgba(0, 0, 0, 0.45);
  animation: shell-in 520ms var(--ease) both;
}

.shell.compact {
  width: min(540px, 100%);
}

@keyframes shell-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Header ──────────────────────────────────────────────── */

.header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: flex-start;
  gap: 18px;
  padding: 22px 24px 18px;
}

.title-block {
  min-width: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  padding: 0;
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-line);
}

h1 {
  margin: 0 0 8px;
  color: var(--fg);
  font-size: 26px;
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  color: var(--fg-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.meta strong {
  color: var(--fg);
  font-weight: 600;
}

.dot-sep {
  color: var(--fg-subtle);
}

/* ── Revision badge ──────────────────────────────────────── */

.revision {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 9px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.revision-pulse {
  position: relative;
  width: 6px;
  height: 6px;
  background: var(--ok);
  box-shadow: 0 0 0 2px var(--ok-soft);
}

.revision-pulse::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 1px solid rgba(111, 207, 151, 0.55);
  animation: pulse 2200ms var(--ease) infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

.revision-label {
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 10px;
}

.revision-num {
  color: var(--accent-fg);
  font-weight: 600;
}

/* ── Progress bar ────────────────────────────────────────── */

.progress {
  position: relative;
  height: 2px;
  margin: 0 24px;
  background: var(--line);
  overflow: hidden;
}

.progress-fill {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(var(--progress, 0));
  transform-origin: left center;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-bright) 100%);
  transition: transform 360ms var(--ease);
  will-change: transform;
}

/* ── Child component hosts ───────────────────────────────── */

cts-todo-stats,
cts-todo-filters,
cts-todo-item {
  display: block;
}

/* ── Stats panel (Progress + Sprint goal) ────────────────── */

.stats-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  gap: 10px;
  padding: 18px 24px 0;
}

.stat-card {
  position: relative;
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.018) 0%, rgba(255, 255, 255, 0) 100%);
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(80% 60% at 100% 0%, rgba(49, 120, 198, 0.05) 0%, transparent 60%);
  opacity: 0.8;
  transition: opacity var(--dur) var(--ease);
}

.stat-card.is-complete::before,
.stat-card.is-met::before {
  background: radial-gradient(80% 60% at 100% 0%, rgba(49, 120, 198, 0.16) 0%, transparent 60%);
  opacity: 1;
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;
}

.stat-label {
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 7px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  color: var(--fg-subtle);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.stat-tag::before {
  content: '';
  width: 5px;
  height: 5px;
  background: var(--fg-subtle);
}

.stat-tag[data-state='live']::before {
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent-line);
}

.stat-tag[data-state='complete']::before {
  background: var(--ok);
  box-shadow: 0 0 6px var(--ok-soft);
}

.stat-tag[data-state='live'] {
  color: var(--accent-fg);
  border-color: var(--accent-line);
  background: var(--accent-soft);
}

.stat-tag[data-state='complete'] {
  color: var(--ok);
  border-color: rgba(111, 207, 151, 0.35);
  background: rgba(111, 207, 151, 0.1);
}

/* Progress display */

.progress-display {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  margin-top: 2px;
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  line-height: 0.95;
  font-variant-numeric: tabular-nums;
}

.progress-num {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.045em;
  background: linear-gradient(180deg, var(--fg) 0%, #c8d3e0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--fg);
}

.is-complete .progress-num {
  background: linear-gradient(180deg, #b6e6c8 0%, var(--ok) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.progress-num.is-empty {
  color: var(--fg-subtle);
  -webkit-text-fill-color: var(--fg-subtle);
  background: none;
}

.progress-suffix {
  margin-left: 2px;
  color: var(--fg-subtle);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.is-complete .progress-suffix {
  color: var(--ok);
}

/* Inline mini progress track inside the card */

.progress-track {
  position: relative;
  height: 3px;
  border-radius: 1px;
  background: var(--line);
  overflow: hidden;
}

.progress-track-fill {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(var(--p, 0));
  transform-origin: left center;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-bright) 100%);
  transition: transform 420ms var(--ease);
  will-change: transform;
}

.is-complete .progress-track-fill {
  background: linear-gradient(90deg, var(--accent-bright) 0%, var(--ok) 100%);
}

/* Goal pips */

.goal-pips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
  min-height: 22px;
}

.pip {
  width: 16px;
  height: 16px;
  border: 1px solid var(--line-strong);
  background: rgba(255, 255, 255, 0.02);
  transition:
    background var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease);
}

.pip.is-filled {
  border-color: var(--accent);
  background: linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 100%);
  box-shadow: 0 0 0 1px rgba(49, 120, 198, 0.2);
}

.is-met .pip.is-filled {
  border-color: var(--ok);
  background: linear-gradient(180deg, #88d6a4 0%, var(--ok) 100%);
  box-shadow: 0 0 0 1px rgba(111, 207, 151, 0.25);
}

.pip-more {
  margin-left: 4px;
  color: var(--fg-subtle);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
}

/* Captions used at the bottom of both cards */

.stat-caption {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  align-self: end;
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.stat-caption strong {
  color: var(--fg);
  font-weight: 600;
}

.goal-sep {
  color: var(--fg-subtle);
}

.goal-met {
  color: var(--ok);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 11px;
}

.goal-over {
  color: var(--accent-fg);
  font-weight: 600;
}

/* Stepper */

.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.stepper-btn {
  width: 26px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.stepper-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--fg);
}

.stepper-btn:disabled {
  opacity: 0.35;
  background: transparent;
}

.stepper-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 24px;
  padding: 0 4px;
  border-left: 1px solid var(--line);
  border-right: 1px solid var(--line);
  color: var(--fg);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ── Composer ────────────────────────────────────────────── */

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 18px 24px 20px;
  border-bottom: 1px solid var(--line);
}

.composer-field {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  height: 42px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
  transition:
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.composer-field:focus-within {
  border-color: var(--accent-line);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.composer-icon {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  color: var(--fg-subtle);
  transition: color var(--dur) var(--ease);
}

.composer-field:focus-within .composer-icon {
  color: var(--accent-fg);
}

.composer input {
  width: 100%;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 14px;
  outline: none;
}

.composer input::placeholder {
  color: var(--fg-subtle);
}

kbd {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  user-select: none;
}

/* ── Buttons ─────────────────────────────────────────────── */

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.02);
  color: var(--fg);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition:
    border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

button:hover {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
}

button:focus-visible {
  outline: none;
  border-color: var(--accent-line);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

button:active {
  transform: translateY(1px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  transform: none;
}

button:disabled:hover {
  border-color: var(--line-strong);
  background: rgba(255, 255, 255, 0.02);
}

.primary {
  border-color: var(--accent);
  background: linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 100%);
  color: #f4f8fd;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 6px 16px -8px rgba(49, 120, 198, 0.6);
}

.primary:hover {
  border-color: var(--accent-bright);
  background: linear-gradient(180deg, #5499e0 0%, var(--accent-bright) 100%);
}

.primary:disabled {
  background: var(--accent-soft);
  border-color: transparent;
  color: var(--accent-fg);
  box-shadow: none;
}

/* ── Filters ─────────────────────────────────────────────── */

.filters {
  display: flex;
  gap: 4px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.012);
}

.filter {
  position: relative;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--fg-muted);
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.filter:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--fg);
  border-color: transparent;
}

.filter[aria-pressed='true'] {
  color: var(--fg);
  background: rgba(255, 255, 255, 0.05);
}

.filter[aria-pressed='true']::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -11px;
  height: 1px;
  background: var(--accent);
  box-shadow: 0 0 8px 0 rgba(49, 120, 198, 0.55);
}

.filter-count {
  display: inline-flex;
  align-items: center;
  height: 18px;
  min-width: 18px;
  padding: 0 5px;
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.05);
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 10px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.filter[aria-pressed='true'] .filter-count {
  background: var(--accent-soft);
  color: var(--accent-fg);
}

/* ── List ────────────────────────────────────────────────── */

.list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
  transition: background var(--dur-fast) var(--ease);
  animation: row-in 360ms var(--ease) both;
  animation-delay: calc(var(--index, 0) * 40ms);
}

.row:last-child {
  border-bottom: 0;
}

cts-todo-item .row:last-child {
  border-bottom: 1px solid var(--line);
}

cts-todo-item:last-child .row:last-child {
  border-bottom: 0;
}

.row:hover {
  background: rgba(255, 255, 255, 0.02);
}

@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Check button — sharp 2px square, GitHub-issue style */

.check {
  width: 20px;
  height: 20px;
  min-width: 20px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xs);
  background: rgba(255, 255, 255, 0.02);
  color: transparent;
  transition:
    border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}

.check:hover {
  border-color: var(--accent-line);
  background: var(--accent-soft);
}

.check[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--accent);
  color: #f4f8fd;
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.check[aria-pressed='true']:hover {
  background: var(--accent-bright);
  border-color: var(--accent-bright);
}

.check-tick {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity var(--dur-fast) var(--ease),
    transform var(--dur) var(--ease);
}

.check[aria-pressed='true'] .check-tick {
  opacity: 1;
  transform: scale(1);
}

/* Task label */

.task-label {
  min-width: 0;
  font-size: 14px;
  color: var(--fg);
  letter-spacing: -0.005em;
}

input.task-label {
  height: 32px;
  width: 100%;
  padding: 0 8px;
  margin: 0 -8px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--fg);
  font: inherit;
  font-size: 14px;
  outline: none;
  transition:
    border-color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease);
}

input.task-label:hover {
  border-color: var(--line-strong);
  background: rgba(255, 255, 255, 0.02);
}

input.task-label:focus {
  border-color: var(--accent-line);
  background: var(--bg);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.task-label.is-done {
  color: var(--fg-subtle);
  text-decoration: line-through;
  text-decoration-color: rgba(91, 99, 112, 0.6);
  text-decoration-thickness: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Remove button */

.remove {
  width: 30px;
  height: 30px;
  padding: 0;
  border-color: transparent;
  background: transparent;
  color: var(--fg-subtle);
  opacity: 0;
  transform: translateX(-2px);
  transition:
    opacity var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease),
    border-color var(--dur-fast) var(--ease);
}

.row:hover .remove,
.row:focus-within .remove,
.remove:focus-visible {
  opacity: 1;
  transform: translateX(0);
}

.remove:hover {
  color: var(--danger);
  background: var(--danger-soft);
  border-color: rgba(196, 106, 106, 0.25);
}

.remove svg {
  display: block;
}

/* ── Empty state ─────────────────────────────────────────── */

.empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 56px 22px 64px;
  text-align: center;
}

.empty-icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 6px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--line-strong);
  color: var(--fg-muted);
}

.empty-title {
  margin: 0;
  color: var(--fg);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.005em;
}

.empty-sub {
  margin: 0;
  max-width: 32ch;
  color: var(--fg-muted);
  font-size: 13px;
  line-height: 1.55;
  text-wrap: balance;
}

/* ── Footer ──────────────────────────────────────────────── */

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 12px;
  padding: 14px 18px 14px 24px;
  border-top: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.18);
}

.footer-stats {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  color: var(--fg-muted);
  font-family:
    'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New',
    monospace;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.footer-stats strong {
  color: var(--fg);
  font-size: 14px;
  font-weight: 600;
}

.footer-divider {
  color: var(--fg-subtle);
}

.footer-label {
  margin-left: 4px;
  color: var(--fg-subtle);
  font-family:
    'Geist',
    'Inter',
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-size: 12px;
  letter-spacing: 0.01em;
}

.footer-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.footer-actions button {
  height: 32px;
  padding: 0 11px;
  font-size: 12px;
  background: transparent;
  border-color: transparent;
  color: var(--fg-muted);
  white-space: nowrap;
}

.footer-actions button:hover {
  border-color: var(--line-strong);
  background: rgba(255, 255, 255, 0.04);
  color: var(--fg);
}

/* ── Responsive ──────────────────────────────────────────── */

@media (max-width: 560px) {
  :host {
    width: 100%;
  }

  .header,
  .stats-panel,
  .composer,
  .footer,
  .row {
    padding-right: 16px;
    padding-left: 16px;
  }

  .header {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .revision {
    justify-self: start;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }

  .filters {
    padding-right: 10px;
    padding-left: 10px;
  }

  .progress {
    margin: 0 16px;
  }

  kbd {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shell,
  .row {
    animation: none;
  }
  .revision-pulse::after {
    animation: none;
    display: none;
  }
}
`,
        })
    ], exports.TodoDashboardElement);

}));
//# sourceMappingURL=site.umd.js.map
