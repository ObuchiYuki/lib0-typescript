"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIfUndefined = void 0;
const setIfUndefined = (map, key, create) => {
    let set = map.get(key);
    if (set === undefined) {
        map.set(key, set = create());
    }
    return set;
};
exports.setIfUndefined = setIfUndefined;
