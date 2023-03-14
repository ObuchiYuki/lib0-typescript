"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.any = exports.setIfUndefined = void 0;
const setIfUndefined = (map, key, create) => {
    let set = map.get(key);
    if (set === undefined) {
        map.set(key, set = create());
    }
    return set;
};
exports.setIfUndefined = setIfUndefined;
const any = (m, f) => {
    for (const [key, value] of m) {
        if (f(value, key)) {
            return true;
        }
    }
    return false;
};
exports.any = any;
