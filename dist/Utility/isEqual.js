"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uint8Array_isEqual = exports.isEqual = void 0;
const isEqual = (a, b) => {
    if (a == null || b == null) {
        return a === b;
    }
    if (a === b) {
        return true;
    }
    if (a.constructor !== b.constructor) {
        return false;
    }
    if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
        const ua = new Uint8Array(a);
        const ub = new Uint8Array(b);
        return (0, exports.Uint8Array_isEqual)(ua, ub);
    }
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
        return (0, exports.Uint8Array_isEqual)(a, b);
    }
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) {
            return false;
        }
        for (const value of a) {
            if (!b.has(value)) {
                return false;
            }
        }
        return true;
    }
    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) {
            return false;
        }
        for (const key of a.keys()) {
            if (!b.has(key) || !(0, exports.isEqual)(a.get(key), b.get(key))) {
                return false;
            }
        }
        return true;
    }
    if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!(0, exports.isEqual)(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    if (a instanceof Object && b instanceof Object) {
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
        for (const key in a) {
            if (!Object.prototype.hasOwnProperty.call(a, key) || !(0, exports.isEqual)(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
};
exports.isEqual = isEqual;
const Uint8Array_isEqual = (a, b) => {
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};
exports.Uint8Array_isEqual = Uint8Array_isEqual;
