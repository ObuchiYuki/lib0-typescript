"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callAll = void 0;
const callAll = (fs, args, i = 0) => {
    try {
        for (; i < fs.length; i++) {
            fs[i](...args);
        }
    }
    finally {
        if (i < fs.length) {
            (0, exports.callAll)(fs, args, i + 1);
        }
    }
};
exports.callAll = callAll;
