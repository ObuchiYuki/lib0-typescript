export type Codable = undefined | null | number | bigint | boolean | string | {
    [Key: string]: Codable;
} | Codable[] | Uint8Array;
/** A BinaryEncoder handles the encoding to an Uint8Array. */
export declare class Encoder {
    /**
     * A cache to store strings temporarily
     */
    private static _strBuffer;
    private static _maxStrBSize;
    private static _floatTestBed;
    private static _textEncoder;
    buffers: Uint8Array[];
    currentBuffer: Uint8Array;
    currentBufferPosition: number;
    /** The current length of the encoded data. */
    get length(): number;
    /** Transform to Uint8Array. */
    toUint8Array(): Uint8Array;
    /**
     * Verify that it is possible to write `len` bytes wtihout checking. If
     * necessary, a new Buffer with the required length is attached.
     */
    reserveLen(length: number): void;
    /**
     * Write one byte to the encoder.
     */
    write1(value: number): void;
    /**
     * Write one byte at a specific position.
     * Position must already be written (i.e. encoder.length > pos)
     */
    set(position: number, value: number): void;
    /** Write one byte as an unsigned integer. */
    writeUint8: (value: number) => void;
    /** Write one byte as an unsigned Integer at a specific location. */
    setUint8: (position: number, value: number) => void;
    /** Write two bytes as an unsigned integer. */
    writeUint16(value: number): void;
    /** Write two bytes as an unsigned integer at a specific location. */
    setUint16(position: number, value: number): void;
    /** Write two bytes as an unsigned integer */
    writeUint32(value: number): void;
    /** Write two bytes as an unsigned integer in big endian order. */
    writeUint32BigEndian(value: number): void;
    /** Write two bytes as an unsigned integer at a specific location. */
    setUint32(position: number, value: number): void;
    /** Write a variable length unsigned integer. Max encodable integer is 2^53. */
    writeVarUint(value: number): void;
    /** Write a variable length integer. */
    writeVarInt(value: number): void;
    /** Write a variable length string. */
    writeVarString(value: string): void;
    /** Write the content of another Encoder. */
    writeBinaryEncoder(encoder: Encoder): void;
    /** Append fixed-length Uint8Array to the encoder. */
    writeUint8Array(uint8Array: Uint8Array): void;
    /** Append an Uint8Array to Encoder. */
    writeVarUint8Array(uint8Array: Uint8Array): void;
    /**
     * Create an DataView of the next `len` bytes. Use it to write data after
     * calling this function.
     *
     * ```ts
     * // write float32 using DataView
     * const dv = writeOnDataView(encoder, 4)
     * dv.setFloat32(0, 1.1)
     * // read float32 using DataView
     * const dv = readFromDataView(encoder, 4)
     * dv.getFloat32(0) // => 1.100000023841858 (leaving it to the reader to find out why this is the correct result)
     * ```
     */
    writeOnDataView(len: number): DataView;
    writeFloat32(value: number): void;
    writeFloat64(value: number): void;
    writeBigInt64(value: bigint): void;
    writeBigUint64(value: bigint): void;
    /** Check if a number can be encoded as a 32 bit float. */
    isFloat32(value: number): boolean;
    /**
     * Encode data with efficient binary format.
     *
     * Differences to JSON:
     * • Transforms data to a binary format (not to a string)
     * • Encodes undefined, NaN, and ArrayBuffer (these can't be represented in JSON)
     * • Numbers are efficiently encoded either as a variable length integer, as a
     *   32 bit float, as a 64 bit float, or as a 64 bit bigint.
     *
     * Encoding table:
     *
     * | Data Type           | Prefix   | Encoding Method    | Comment |
     * | ------------------- | -------- | ------------------ | ------- |
     * | undefined           | 127      |                    | Functions, symbol, and everything that cannot be identified is encoded as undefined |
     * | null                | 126      |                    | |
     * | integer             | 125      | writeVarInt        | Only encodes 32 bit signed integers |
     * | float32             | 124      | writeFloat32       | |
     * | float64             | 123      | writeFloat64       | |
     * | bigint              | 122      | writeBigInt64      | |
     * | boolean (false)     | 121      |                    | True and false are different data types so we save the following byte |
     * | boolean (true)      | 120      |                    | - 0b01111000 so the last bit determines whether true or false |
     * | string              | 119      | writeVarString     | |
     * | object<string,any>  | 118      | custom             | Writes {length} then {length} key-value pairs |
     * | array<any>          | 117      | custom             | Writes {length} then {length} json values |
     * | Uint8Array          | 116      | writeVarUint8Array | We use Uint8Array for any kind of binary data |
     *
     * Reasons for the decreasing prefix:
     * We need the first bit for extendability (later we may want to encode the
     * prefix with writeVarUint). The remaining 7 bits are divided as follows:
     * [0-30]   the beginning of the data range is used for custom purposes
     *          (defined by the function that uses this library)
     * [31-127] the end of the data range is used for data encoding by
     *          lib0/encoding.js
     *
     * @param {Codable} data
     */
    writeAny(data: Codable): void;
    private isNegative;
}
/**
 * Now come a few stateful encoder that have their own classes.
 */
/**
 * Basic Run Length Encoder - a basic compression implementation.
 *
 * Encodes [1,1,1,7] to [1,3,7,1] (3 times 1, 1 time 7). This encoder might do more harm than good if there are a lot of values that are not repeated.
 *
 * It was originally used for image compression. Cool .. article http://csbruce.com/cbm/transactor/pdfs/trans_v7_i06.pdf
 */
export declare class RleEncoder<T extends number> extends Encoder {
    writer: (encoder: Encoder, value: T) => void;
    state: T | null;
    count: number;
    constructor(writer: (encoder: Encoder, value: T) => void);
    write(value: T): void;
}
/**
 * Basic diff decoder using variable length encoding.
 *
 * Encodes the values [3, 1100, 1101, 1050, 0] to [3, 1097, 1, -51, -1050] using writeVarInt.
 */
export declare class IntDiffEncoder extends Encoder {
    state: number;
    constructor(start: number);
    write(value: number): void;
}
/**
 * A combination of IntDiffEncoder and RleEncoder.
 *
 * Basically first writes the IntDiffEncoder and then counts duplicate diffs using RleEncoding.
 *
 * Encodes the values [1,1,1,2,3,4,5,6] as [1,1,0,2,1,5] (RLE([1,0,0,1,1,1,1,1]) ⇒ RleIntDiff[1,1,0,2,1,5])
 */
export declare class RleIntDiffEncoder extends Encoder {
    state: number;
    count: number;
    constructor(start: number);
    write(value: number): void;
}
/**
 * Optimized Rle encoder that does not suffer from the mentioned problem of the basic Rle encoder.
 *
 * Internally uses VarInt encoder to write unsigned integers. If the input occurs multiple times, we write
 * write it as a negative number. The UintOptRleDecoder then understands that it needs to read a count.
 *
 * Encodes [1,2,3,3,3] as [1,2,-3,3] (once 1, once 2, three times 3)
 */
export declare class UintOptRleEncoder {
    encoder: Encoder;
    state: number;
    count: number;
    constructor();
    write(value: number): void;
    toUint8Array(): Uint8Array;
    static flush(encoder: UintOptRleEncoder): void;
}
/**
 * Increasing Uint Optimized RLE Encoder
 *
 * The RLE encoder counts the number of same occurences of the same value.
 * The IncUintOptRle encoder counts if the value increases.
 * I.e. 7, 8, 9, 10 will be encoded as [-7, 4]. 1, 3, 5 will be encoded
 * as [1, 3, 5].
 */
export declare class IncUintOptRleEncoder {
    encoder: Encoder;
    state: number;
    count: number;
    constructor();
    write(value: number): void;
    toUint8Array(): Uint8Array;
}
/**
 * A combination of the IntDiffEncoder and the UintOptRleEncoder.
 *
 * The count approach is similar to the UintDiffOptRleEncoder, but instead of using the negative bitflag, it encodes
 * in the LSB whether a count is to be read. Therefore this Encoder only supports 31 bit integers!
 *
 * Encodes [1, 2, 3, 2] as [3, 1, 6, -1] (more specifically [(1 << 1) | 1, (3 << 0) | 0, -1])
 *
 * Internally uses variable length encoding. Contrary to normal UintVar encoding, the first byte contains:
 * * 1 bit that denotes whether the next value is a count (LSB)
 * * 1 bit that denotes whether this value is negative (MSB - 1)
 * * 1 bit that denotes whether to continue reading the variable length integer (MSB)
 *
 * Therefore, only five bits remain to encode diff ranges.
 *
 * Use this Encoder only when appropriate. In most cases, this is probably a bad idea.
 */
export declare class IntDiffOptRleEncoder {
    encoder: Encoder;
    state: number;
    count: number;
    diff: number;
    constructor();
    write(value: number): void;
    toUint8Array(): Uint8Array;
    flush(): void;
}
/**
 * Optimized String Encoder.
 *
 * Encoding many small strings in a simple Encoder is not very efficient. The function call to decode a string takes some time and creates references that must be eventually deleted.
 * In practice, when decoding several million small strings, the GC will kick in more and more often to collect orphaned string objects (or maybe there is another reason?).
 *
 * This string encoder solves the above problem. All strings are concatenated and written as a single string using a single encoding call.
 *
 * The lengths are encoded using a UintOptRleEncoder.
 */
export declare class StringEncoder {
    sarr: string[];
    state: string;
    lensE: UintOptRleEncoder;
    constructor();
    write(string: string): void;
    toUint8Array(): Uint8Array;
}
