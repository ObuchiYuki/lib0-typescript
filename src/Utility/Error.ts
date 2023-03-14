
export class UnimplementedMethodError extends Error {
    constructor() {
        super("Unimplemented Method")
    }
}

export class UnexpectedCaseError extends Error {
    constructor() {
        super("Unexpected case")
    }
}