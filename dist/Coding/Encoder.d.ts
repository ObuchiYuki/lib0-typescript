export type Codable = undefined | null | number | bigint | boolean | string | {
    [Key in string]: Codable;
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
    write(value: number): void;
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
     * @param {Encoder} encoder
     * @param {} data
     */
    writeAny(data: Codable): void;
    private isNegative;
}
