export type Equatable = undefined | null | boolean | number | string | Uint8Array | ArrayBuffer | Set<Equatable> | Map<Equatable, Equatable> | {
    [Key in string]: Equatable;
} | Equatable[];
export declare const isEqual: (a: Equatable, b: Equatable) => boolean;
export declare const Uint8Array_isEqual: (a: Uint8Array, b: Uint8Array) => boolean;
