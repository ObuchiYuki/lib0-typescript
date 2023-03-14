"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnimplementedMethodError = void 0;
class UnimplementedMethodError extends Error {
    constructor() {
        super("Unimplemented Method");
    }
}
exports.UnimplementedMethodError = UnimplementedMethodError;
