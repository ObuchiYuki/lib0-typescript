"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNegative = void 0;
const isNegative = (n) => {
    if (n !== 0) {
        return n < 0;
    }
    else {
        return 1 / n < 0;
    }
};
exports.isNegative = isNegative;
