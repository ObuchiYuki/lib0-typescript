export declare class Decoder {
    arr: Uint8Array;
    pos: number;
    constructor(uint8Array: Uint8Array);
    hasContent(): boolean;
    clone(newPos?: number): Decoder;
    readUint8Array(len: number): Uint8Array;
    readVarUint8Array(): Uint8Array;
    readUint8(): number;
    readVarUint(): number;
    readVarInt: () => number;
    readVarString(): string;
    readFromDataView: (len: number) => DataView;
    readFloat32(): number;
    readFloat64(): number;
    readBigInt64(): bigint;
    readBigUint64(): bigint;
    readAny(): any;
}
export declare class RleDecoder<T extends number> {
    decoder: Decoder;
    reader: (decoder: Decoder) => T;
    state: T | null;
    count: number;
    constructor(uint8Array: Uint8Array, reader: (arg0: Decoder) => T);
    read(): T;
}
export declare class IntDiffDecoder {
    decoder: Decoder;
    state: number;
    constructor(uint8Array: Uint8Array, start: number);
    read(): number;
}
export declare class RleIntDiffDecoder {
    decoder: Decoder;
    state: number;
    count: number;
    constructor(uint8Array: Uint8Array, start: number);
    read(): number;
}
export declare class UintOptRleDecoder {
    decoder: Decoder;
    state: number;
    count: number;
    constructor(uint8Array: Uint8Array);
    read(): number;
}
export declare class IncUintOptRleDecoder {
    decoder: Decoder;
    state: number;
    count: number;
    constructor(uint8Array: Uint8Array);
    read(): number;
}
export declare class IntDiffOptRleDecoder {
    decoder: Decoder;
    s: number;
    count: number;
    diff: number;
    constructor(uint8Array: Uint8Array);
    read(): number;
}
export declare class StringDecoder {
    decoder: UintOptRleDecoder;
    str: string;
    spos: number;
    constructor(uint8Array: Uint8Array);
    read(): string;
}
