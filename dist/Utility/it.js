"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.it = void 0;
const it = (value, block) => {
    block(value);
    return value;
};
exports.it = it;
