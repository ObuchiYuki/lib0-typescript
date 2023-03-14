"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Observable = void 0;
class Observable {
    constructor() {
        this._observers = new Map();
    }
    on(name, observer) {
        var _a;
        if (this._observers.get(name) == null)
            this._observers.set(name, new Set());
        (_a = this._observers.get(name)) === null || _a === void 0 ? void 0 : _a.add(observer);
    }
    once(name, observer) {
        const _observer = (...args) => {
            this.off(name, _observer);
            observer(...args);
        };
        this.on(name, _observer);
    }
    off(name, observer) {
        const observers = this._observers.get(name);
        if (observers !== undefined) {
            observers.delete(observer);
            if (observers.size === 0) {
                this._observers.delete(name);
            }
        }
    }
    isObserving(name) {
        return this._observers.has(name);
    }
    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     */
    emit(name, args) {
        // copy all listeners to an array first to make sure that no event is emitted to listeners that are subscribed while the event handler is called.
        const listeners = this._observers.get(name);
        if (listeners == null)
            return;
        Array.from(listeners.values()).forEach(f => f(...args));
    }
    destroy() {
        this._observers = new Map();
    }
}
exports.Observable = Observable;
