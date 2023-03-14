import { Codable } from "./Encoder";
/** A Decoder handles the decoding of an Uint8Array.*/
export declare class Decoder {
    /** Decoding target. */
    data: Uint8Array;
    /** Current decoding position. */
    position: number;
    private static _decoder;
    constructor(data: Uint8Array);
    hasContent(): boolean;
    /**
     * Clone a decoder instance.
     * Optionally set a new position parameter.
     */
    clone(newPosition?: number): Decoder;
    /**
     * Create an Uint8Array view of the next `len` bytes and advance the position by `len`.
     *
     * Important: The Uint8Array still points to the underlying ArrayBuffer. Make sure to discard the result as soon as possible to prevent any memory leaks.
     *            Use `buffer.copyUint8Array` to copy the result into a new Uint8Array.
     *
     */
    readUint8Array(length: number): Uint8Array;
    /**
     * Read variable length Uint8Array.
     *
     * Important: The Uint8Array still points to the underlying ArrayBuffer. Make sure to discard the result as soon as possible to prevent any memory leaks.
     *            Use `buffer.copyUint8Array` to copy the result into a new Uint8Array.
     */
    readVarUint8Array(): Uint8Array;
    /**
     * Read the rest of the content as an ArrayBuffer
     */
    readTailAsUint8Array(): Uint8Array;
    /**
     * Skip one byte, jump to the next position.
     */
    skip8(): void;
    /**
     * Read one byte as unsigned integer.
     */
    readUint8(): number;
    /**
     * Read 2 bytes as unsigned integer.
     */
    readUint16(): number;
    /**
     * Read 4 bytes as unsigned integer.
     */
    readUint32(): number;
    /**
     * Read 4 bytes as unsigned integer in big endian order.
     * (most significant byte first)
     */
    readUint32BigEndian(): number;
    /**
     * Look ahead without incrementing the position
     * to the next byte and read it as unsigned integer.
     */
    peekUint8(): number;
    /**
     * Look ahead without incrementing the position
     * to the next byte and read it as unsigned integer.
     */
    peekUint16(): number;
    /**
    * Look ahead without incrementing the position
    * to the next byte and read it as unsigned integer.
    */
    peekUint32(): void;
    /**
    * Read unsigned integer (32bit) with variable length.
    * 1/8th of the storage is used as encoding overhead.
    *  * numbers < 2^7 is stored in one bytlength
    *  * numbers < 2^14 is stored in two bylength
    */
    readVarUint(): number;
    /**
    * Read signed integer (32bit) with variable length.
    * 1/8th of the storage is used as encoding overhead.
    *  * numbers < 2^7 is stored in one bytlength
    *  * numbers < 2^14 is stored in two bylength
    * @todo This should probably create the inverse ~num if number is negative - but this would be a breaking change.
    */
    readVarInt(): number;
    /**
    * Look ahead and read varUint without incrementing position
    */
    peekVarUint(): number;
    /**
    * Look ahead and read varUint without incrementing position
    */
    peekVarInt(): number;
    /**
    * Read string of variable length
    * * varUint is used to store the length of the string
    */
    readVarString(): string;
    readFromDataView(length: number): DataView;
    readFloat32(): number;
    readFloat64(): number;
    readBigInt64(): bigint;
    readBigUint64(): bigint;
    readAny(): Codable;
}
export declare class RleDecoder<T extends number> extends Decoder {
    reader: (decoder: Decoder) => T;
    state: T | null;
    count: number;
    constructor(uint8Array: Uint8Array, reader: (decoder: Decoder) => T);
    read(): T;
}
export declare class IntDiffDecoder extends Decoder {
    state: number;
    constructor(uint8Array: Uint8Array, start: number);
    read(): number;
}
export declare class RleIntDiffDecoder extends Decoder {
    state: number;
    count: number;
    constructor(uint8Array: Uint8Array, start: number);
    read(): number;
}
export declare class UintOptRleDecoder extends Decoder {
    state: number;
    count: number;
    constructor(uint8Array: Uint8Array);
    read(): number;
}
export declare class IncUintOptRleDecoder extends Decoder {
    state: number;
    count: number;
    constructor(uint8Array: Uint8Array);
    read(): number;
}
export declare class IntDiffOptRleDecoder extends Decoder {
    state: number;
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
