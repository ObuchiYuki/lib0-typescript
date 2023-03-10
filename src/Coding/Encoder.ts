export type Codable = undefined|null|number|bigint|boolean|string|{ [Key: string]: Codable }|Codable[]|Uint8Array

/** A BinaryEncoder handles the encoding to an Uint8Array. */
export class Encoder {
    /**
     * A cache to store strings temporarily
     */
    private static _strBuffer = new Uint8Array(30000)
    private static _maxStrBSize = Encoder._strBuffer.length / 3
    private static _floatTestBed = new DataView(new ArrayBuffer(4))
    private static _textEncoder = new TextEncoder()

    buffers: Uint8Array[] = []

    currentBuffer: Uint8Array = new Uint8Array(100)
    currentBufferPosition: number = 0

    /** The current length of the encoded data. */
    get length() {
        let len = this.currentBufferPosition
        for (const buffer of this.buffers) {
            len += buffer.length
        }
        return len
    }

    /** Transform to Uint8Array. */
    toUint8Array() {
        const uint8array = new Uint8Array(this.length)
        let cursor = 0
        for (const buffer of this.buffers) {
            uint8array.set(buffer, cursor)
            cursor += buffer.length
        }
        uint8array.set(new Uint8Array(this.currentBuffer.buffer, 0, this.currentBufferPosition))
        return uint8array
    }

    /**
     * Verify that it is possible to write `len` bytes wtihout checking. If
     * necessary, a new Buffer with the required length is attached.
     */
    reserveLen(length: number) {
        const bufferLength = this.currentBuffer.length
        if (bufferLength - this.currentBufferPosition < length) {
            this.buffers.push(new Uint8Array(this.currentBuffer.buffer, 0, this.currentBufferPosition))
            this.currentBuffer = new Uint8Array(Math.max(bufferLength, length) * 2)
            this.currentBufferPosition = 0
        }
    }

    /**
     * Write one byte to the encoder.
     */
    write(value: number) {
        const bufferLen = this.currentBuffer.length
        if (this.currentBufferPosition === bufferLen) {
            this.buffers.push(this.currentBuffer)
            this.currentBuffer = new Uint8Array(bufferLen * 2)
            this.currentBufferPosition = 0
        }
        this.currentBuffer[this.currentBufferPosition] = value
        this.currentBufferPosition += 1
    }

    /**
     * Write one byte at a specific position.
     * Position must already be written (i.e. encoder.length > pos)
     */
    set(position: number, value: number) {
        // console.assert(this.length < position)
        let buffer = null
        // iterate all buffers and adjust position
        for (let i = 0; i < this.buffers.length && buffer === null; i++) {
            const b = this.buffers[i]
            if (position < b.length) {
                buffer = b // found buffer
            } else {
                position -= b.length
            }
        }
        if (buffer === null) {
            // use current buffer
            buffer = this.currentBuffer
        }
        buffer[position] = value
    }

    /** Write one byte as an unsigned integer. */
    writeUint8 = this.write

    /** Write one byte as an unsigned Integer at a specific location. */
    setUint8 = this.set

    /** Write two bytes as an unsigned integer. */
    writeUint16(value: number) {
        this.write(value & 0b1111_1111)
        this.write((value >>> 8) & 0b1111_1111)
    }
    
    /** Write two bytes as an unsigned integer at a specific location. */
    setUint16(position: number, value: number) {
        this.set(position, value & 0b1111_1111)
        this.set(position + 1, (value >>> 8) & 0b1111_1111)
    }

    /** Write two bytes as an unsigned integer */
    writeUint32(value: number) {
        for (let i = 0; i < 4; i++) {
            this.write(value & 0b1111_1111)
            value >>>= 8
        }
    }
    
    /** Write two bytes as an unsigned integer in big endian order. */
    writeUint32BigEndian(value: number) {
        for (let i = 3; i >= 0; i--) {
            this.write((value >>> (8 * i)) & 0b1111_1111)
        }
    }
    
    /** Write two bytes as an unsigned integer at a specific location. */
    setUint32(position: number, value: number) {
        for (let i = 0; i < 4; i++) {
            this.set(position + i, value & 0b1111_1111)
            value >>>= 8
        }
    }


    /** Write a variable length unsigned integer. Max encodable integer is 2^53. */
    writeVarUint(value: number) {
        while (value > 0b0111_1111) {
            this.write(0b1000_0000 | (0b0111_1111 & value))
            value = Math.floor(value / 128) // shift >>> 7
        }
        this.write(0b0111_1111 & value)
    }
    
    /** Write a variable length integer. */
    writeVarInt(value: number) {
        const isNegative = this.isNegative(value)
        if (isNegative) { value = -value }
        //        |- whether to continue reading (8th bit) |- whether is negative (7th bit) |- number (bottom 6bits)
        this.write((value > 0b0011_1111 ? 0b1000_0000 : 0) | (isNegative ? 0b0100_0000 : 0) | (0b0011_1111 & value))
        value = Math.floor(value / 64) // shift >>> 6
        // We don't need to consider the case of num === 0 so we can use a different
        // pattern here than above.
        while (value > 0) {
            //        |- whether to continue reading (8th bit) |- number (bottom 7bits)
            this.write((value > 0b0111_1111 ? 0b1000_0000 : 0) | (0b0111_1111 & value))
            value = Math.floor(value / 128) // shift >>> 7
        }
    }

    /** Write a variable length string. */
    writeVarString(value: string) {
        if (value.length < Encoder._maxStrBSize) {
            // We can encode the string into the existing buffer
            const written = Encoder._textEncoder.encodeInto(value, Encoder._strBuffer).written || 0
            this.writeVarUint(written)
            for (let i = 0; i < written; i++) {
                this.write(Encoder._strBuffer[i])
            }
        } else {
            this.writeVarUint8Array(Encoder._textEncoder.encode(value))
        }
    }

    /** Write the content of another Encoder. */
    writeBinaryEncoder(encoder: Encoder) {
        this.writeUint8Array(encoder.toUint8Array())
    }

    /** Append fixed-length Uint8Array to the encoder. */
    writeUint8Array(uint8Array: Uint8Array) {
        const bufferLen = this.currentBuffer.length
        const cpos = this.currentBufferPosition
        const leftCopyLen = Math.min(bufferLen - cpos, uint8Array.length)
        const rightCopyLen = uint8Array.length - leftCopyLen
        this.currentBuffer.set(uint8Array.subarray(0, leftCopyLen), cpos)
        this.currentBufferPosition += leftCopyLen
        if (rightCopyLen > 0) {
            // Still something to write, write right half..
            // Append new buffer
            this.buffers.push(this.currentBuffer)
            // must have at least size of remaining buffer
            this.currentBuffer = new Uint8Array(Math.max(bufferLen * 2, rightCopyLen))
            // copy array
            this.currentBuffer.set(uint8Array.subarray(leftCopyLen))
            this.currentBufferPosition = rightCopyLen
        }
    }

    /** Append an Uint8Array to Encoder. */
    writeVarUint8Array(uint8Array: Uint8Array) {
        this.writeVarUint(uint8Array.byteLength)
        this.writeUint8Array(uint8Array)
    }

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
    writeOnDataView(len: number) {
        this.reserveLen(len)
        const dview = new DataView(this.currentBuffer.buffer, this.currentBufferPosition, len)
        this.currentBufferPosition += len
        return dview
    }

    writeFloat32(value: number) {
        this.writeOnDataView(4).setFloat32(0, value, false)
    }

    writeFloat64(value: number) {
        this.writeOnDataView(8).setFloat64(0, value, false)
    }

    writeBigInt64(value: bigint) {
        this.writeOnDataView(8).setBigInt64(0, value, false)
    }

    writeBigUint64(value: bigint) {
        this.writeOnDataView(8).setBigUint64(0, value, false)
    }

    /** Check if a number can be encoded as a 32 bit float. */
    isFloat32(value: number)  {
        Encoder._floatTestBed.setFloat32(0, value)
        return Encoder._floatTestBed.getFloat32(0) === value
    }

    /**
     * Encode data with efficient binary format.
     *
     * Differences to JSON:
     * ??? Transforms data to a binary format (not to a string)
     * ??? Encodes undefined, NaN, and ArrayBuffer (these can't be represented in JSON)
     * ??? Numbers are efficiently encoded either as a variable length integer, as a
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
    writeAny(data: Codable) {
        switch (typeof data) {
        case 'string':
            // TYPE 119: STRING
            this.write(119)
            this.writeVarString(data)
            break
        case 'number':
            if (Number.isInteger(data) && Math.abs(data) <= 0x7FFFFFFF /* BITS31 */) {
                // TYPE 125: INTEGER
                this.write(125)
                this.writeVarInt(data)
            } else if (this.isFloat32(data)) {
                // TYPE 124: FLOAT32
                this.write(124)
                this.writeFloat32(data)
            } else {
                // TYPE 123: FLOAT64
                this.write(123)
                this.writeFloat64(data)
            }
            break
        case 'bigint':
            // TYPE 122: BigInt
            this.write(122)
            this.writeBigInt64(data)
            break
        case 'object':
            if (data === null) {
                // TYPE 126: null
                this.write(126)
            } else if (data instanceof Array) {
                // TYPE 117: Array
                this.write(117)
                this.writeVarUint(data.length)
                for (let i = 0; i < data.length; i++) {
                    this.writeAny(data[i])
                }
            } else if (data instanceof Uint8Array) {
                // TYPE 116: ArrayBuffer
                this.write(116)
                this.writeVarUint8Array(data)
            } else {
                // TYPE 118: Object
                this.write(118)
                const keys = Object.keys(data)
                this.writeVarUint(keys.length)
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    this.writeVarString(key)
                    this.writeAny(data[key])
                }
            }
            break
        case 'boolean':
            // TYPE 120/121: boolean (true/false)
            this.write(data ? 120 : 121)
            break
        default:
            // TYPE 127: undefined
            this.write(127)
        }
    }

    private isNegative(n: number) {
        if (n !== 0) {
            return n < 0 
        } else {
            return 1 / n < 0
        }
    }
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
export class RleEncoder<T extends number> extends Encoder {
    writer: (encoder: Encoder, value: T) => void
    state: T | null = null
    count = 0

    constructor(writer: (encoder: Encoder, value: T) => void) {
        super()
        this.writer = writer
    }
  
    write(value: T) {
        if (this.state === value) {
            this.count++
        } else {
            if (this.count > 0) {
                // flush counter, unless this is the first value (count = 0)
                this.writeVarUint(this.count - 1) // since count is always > 0, we can decrement by one. non-standard encoding ftw
            }
            this.count = 1
            // write first value
            this.writer(this, value)
            this.state = value
        }
    }
}
  
/**
 * Basic diff decoder using variable length encoding.
 *
 * Encodes the values [3, 1100, 1101, 1050, 0] to [3, 1097, 1, -51, -1050] using writeVarInt.
 */
export class IntDiffEncoder extends Encoder {
    state: number

    constructor(start: number) {
        super()
        this.state = start
    }

    write(value: number) {
        this.writeVarInt(value - this.state)
        this.state = value
    }
}
  
/**
 * A combination of IntDiffEncoder and RleEncoder.
 *
 * Basically first writes the IntDiffEncoder and then counts duplicate diffs using RleEncoding.
 *
 * Encodes the values [1,1,1,2,3,4,5,6] as [1,1,0,2,1,5] (RLE([1,0,0,1,1,1,1,1]) ??? RleIntDiff[1,1,0,2,1,5])
 */
export class RleIntDiffEncoder extends Encoder {
    state: number
    count = 0

    constructor(start: number) {
        super()
        this.state = start
    }

    write(value: number) {
        if (this.state === value && this.count > 0) {
        this.count++
        } else {
            if (this.count > 0) {
                // flush counter, unless this is the first value (count = 0)
                this.writeVarUint(this.count - 1) // since count is always > 0, we can decrement by one. non-standard encoding ftw
            }
            this.count = 1
            // write first value
            this.writeVarInt(value - this.state)
            this.state = value
        }
    }
}
 
/**
 * Optimized Rle encoder that does not suffer from the mentioned problem of the basic Rle encoder.
 *
 * Internally uses VarInt encoder to write unsigned integers. If the input occurs multiple times, we write
 * write it as a negative number. The UintOptRleDecoder then understands that it needs to read a count.
 *
 * Encodes [1,2,3,3,3] as [1,2,-3,3] (once 1, once 2, three times 3)
 */
export class UintOptRleEncoder {
    encoder = new Encoder()
    state = 0
    count = 0
    
    constructor () {}

    write(value: number) {
        if (this.state === value) {
            this.count++    
        } else {
            UintOptRleEncoder.flush(this)
            this.count = 1
            this.state = value
        }
    }

    toUint8Array () {
        UintOptRleEncoder.flush(this)
        return this.encoder.toUint8Array()
    }

    static flush(encoder: UintOptRleEncoder) {
        if (encoder.count > 0) {
            // flush counter, unless this is the first value (count = 0)
            // case 1: just a single value. set sign to positive
            // case 2: write several values. set sign to negative to indicate that there is a length coming
            encoder.encoder.writeVarInt(encoder.count === 1 ? encoder.state : -encoder.state)
    
            if (encoder.count > 1) {
                encoder.encoder.writeVarUint(encoder.count - 2) // since count is always > 1, we can decrement by one. non-standard encoding ftw
            }
        }
    }    
}
  
/**
 * Increasing Uint Optimized RLE Encoder
 *
 * The RLE encoder counts the number of same occurences of the same value.
 * The IncUintOptRle encoder counts if the value increases.
 * I.e. 7, 8, 9, 10 will be encoded as [-7, 4]. 1, 3, 5 will be encoded
 * as [1, 3, 5].
 */
export class IncUintOptRleEncoder {
    encoder = new Encoder()
    state = 0
    count = 0
    constructor () {}

    write(value: number) {
        if (this.state + this.count === value) {
            this.count++
        } else {
            UintOptRleEncoder.flush(this)
            this.count = 1
            this.state = value
        }
    }

    toUint8Array () {
        UintOptRleEncoder.flush(this)
        return this.encoder.toUint8Array()
    }
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
export class IntDiffOptRleEncoder {
    encoder = new Encoder()
    state = 0
    count = 0
    diff = 0

    constructor() {}

    write(value: number) {
        if (this.diff === value - this.state) {
            this.state = value
            this.count++
        } else {
            this.flush()
            this.count = 1
            this.diff = value - this.state
            this.state = value
        }
    }

    toUint8Array () {
        this.flush()
        return this.encoder.toUint8Array()
    }

        
    flush() {
        if (this.count > 0) {
            // 31 bit making up the diff | wether to write the counter
            // const encodedDiff = encoder.diff << 1 | (encoder.count === 1 ? 0 : 1)
            const encodedDiff = this.diff * 2 + (this.count === 1 ? 0 : 1)
            // flush counter, unless this is the first value (count = 0)
            // case 1: just a single value. set first bit to positive
            // case 2: write several values. set first bit to negative to indicate that there is a length coming
            this.encoder.writeVarInt(encodedDiff)
            if (this.count > 1) {
                this.encoder.writeVarUint(this.count - 2) // since count is always > 1, we can decrement by one. non-standard encoding ftw
            }
        }
    }
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
export class StringEncoder {
    sarr: string[] = []
    state = ''
    lensE = new UintOptRleEncoder()
    
    constructor () {}

    write(string: string) {
        this.state += string
        if (this.state.length > 19) {
            this.sarr.push(this.state)
            this.state = ''
        }
        this.lensE.write(string.length)
    }

    toUint8Array() {
        const encoder = new Encoder()
        this.sarr.push(this.state)
        this.state = ''
        encoder.writeVarString(this.sarr.join(''))
        encoder.writeUint8Array(this.lensE.toUint8Array())
        return encoder.toUint8Array()
    }
}
