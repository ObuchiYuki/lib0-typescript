
export type Equatable = undefined|null|boolean|number|string|Uint8Array|ArrayBuffer|Set<Equatable>|Map<Equatable, Equatable>|{ [Key in string]: Equatable }|Equatable[]


export const isEqual = (a: Equatable, b: Equatable): boolean => {
    if (a == null || b == null) { return a === b}
    if (a === b) { return true }
    if (a.constructor !== b.constructor) { return false }
    if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
        const ua = new Uint8Array(a)
        const ub = new Uint8Array(b)
        return Uint8Array_isEqual(ua, ub)
    }
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
        return Uint8Array_isEqual(a, b)
    }
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) { return false }
        for (const value of a) {
            if (!b.has(value)) { return false }
        }
        return true
    }
    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) { return false }
        for (const key of a.keys()) {
            if (!b.has(key) || !isEqual(a.get(key), b.get(key))) { return false }
        }
        return true
    }
    if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) { return false }
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i])) { return false }
        }
        return true
    }
    if (a instanceof Object && b instanceof Object) {
        if (Object.keys(a).length !== Object.keys(b).length) { return false }
        for (const key in a) {
            if (!Object.prototype.hasOwnProperty.call(a, key) || !isEqual((a as any)[key], (b as any)[key])) { return false }
        }
        return true
    }
    return false
}
    
export const Uint8Array_isEqual = (a: Uint8Array, b: Uint8Array): boolean => {
    if (a.byteLength !== b.byteLength) { return false }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) { return false }
    }
    return true
}