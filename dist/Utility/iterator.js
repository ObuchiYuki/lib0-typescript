"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterIterator = exports.mapIterator = void 0;
const mapIterator = (iterator, body) => ({
    [Symbol.iterator]() { return this; },
    next() {
        const { done, value } = iterator.next();
        return { value: body(value), done: done };
    }
});
exports.mapIterator = mapIterator;
const filterIterator = (iterator, filter) => ({
    [Symbol.iterator]() { return this; },
    next() {
        let res;
        do {
            res = iterator.next();
        } while (!res.done && !filter(res.value));
        return res;
    }
});
exports.filterIterator = filterIterator;
