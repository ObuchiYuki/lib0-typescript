export type Codable = undefined | null | number | bigint | boolean | string | {
    [Key: string]: Codable;
} | Codable[] | Uint8Array;
export declare class Encoder {
    cpos: number;
    cbuf: Uint8Array;
    bufs: Uint8Array[];
    constructor();
    get length(): number;
    toUint8Array(): Uint8Array;
    verifyLen(len: number): void;
    write(num: number): void;
    set(pos: number, num: number): void;
    writeUint8(value: number): void;
    writeVarUint(num: number): void;
    writeVarInt(num: number): void;
    writeVarString(str: string): void;
    writeUint8Array(uint8Array: Uint8Array): void;
    writeVarUint8Array(uint8Array: Uint8Array): void;
    writeOnDataView(len: number): DataView;
    writeFloat32(num: number): void;
    writeFloat64(num: number): void;
    writeBigInt64(num: bigint): void;
    writeBigUint64(num: bigint): void;
    static isFloat32(num: number): boolean;
    writeAny(data: any): void;
}
export declare class RleEncoder<T extends number> {
    encoder: Encoder;
    writer: (encoder: Encoder, value: T) => void;
    s: number | null;
    count: number;
    constructor(writer: (encoder: Encoder, value: T) => void);
    write(v: T): void;
}
export declare class IntDiffEncoder {
    encoder: Encoder;
    s: number;
    constructor(start: number);
    write(v: number): void;
}
export declare class RleIntDiffEncoder {
    encoder: Encoder;
    s: number;
    count: number;
    constructor(start: number);
    write(v: number): void;
}
export declare class UintOptRleEncoder {
    encoder: Encoder;
    s: number;
    count: number;
    mutated: boolean;
    constructor();
    write(v: number): void;
    toUint8Array(): Uint8Array;
}
export declare class IncUintOptRleEncoder {
    encoder: Encoder;
    s: number;
    count: number;
    mutated: boolean;
    constructor();
    write(v: number): void;
    toUint8Array(): Uint8Array;
}
export declare class IntDiffOptRleEncoder {
    encoder: Encoder;
    s: number;
    count: number;
    diff: number;
    mutated: boolean;
    constructor();
    write(v: number): void;
    toUint8Array(): Uint8Array;
    flush(): void;
}
export declare class StringEncoder {
    sarr: string[];
    s: string;
    lensE: UintOptRleEncoder;
    mutated: boolean;
    constructor();
    write(string: string): void;
    toUint8Array(): Uint8Array;
}
