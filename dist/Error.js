"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedCaseError = exports.UnimplementedMethodError = void 0;
class UnimplementedMethodError extends Error {
    constructor() {
        super("Unimplemented Method");
    }
}
exports.UnimplementedMethodError = UnimplementedMethodError;
class UnexpectedCaseError extends Error {
    constructor() {
        super("Unexpected case");
    }
}
exports.UnexpectedCaseError = UnexpectedCaseError;
