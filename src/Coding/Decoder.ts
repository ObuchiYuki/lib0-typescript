import { Codable } from "./Encoder"
import { isNegative } from "./isNegative"

const errorIntegerOutOfRange = new Error('Integer out of Range')
const errorUnexpectedEndOfArray = new Error('Unexpected end of array')

/** A Decoder handles the decoding of an Uint8Array.*/
export class Decoder {    
    /** Decoding target. */
    data: Uint8Array
    /** Current decoding position. */
    position: number = 0

    private static _decoder = new TextDecoder()

    constructor (data: Uint8Array) {
        this.data = data
    }


    hasContent() {
        return this.position !== this.data.length
    } 

    /**
     * Clone a decoder instance.
     * Optionally set a new position parameter.
     */
    clone(newPosition: number = this.position) {
        const _decoder = new Decoder(this.data)
        _decoder.position = newPosition
        return _decoder
    }

    /**
     * Create an Uint8Array view of the next `len` bytes and advance the position by `len`.
     *
     * Important: The Uint8Array still points to the underlying ArrayBuffer. Make sure to discard the result as soon as possible to prevent any memory leaks.
     *            Use `buffer.copyUint8Array` to copy the result into a new Uint8Array.
     * 
     */
    readUint8Array(length: number): Uint8Array {
        const view = new Uint8Array(
            this.data.buffer, this.position + this.data.byteOffset, length
        )
        this.position += length
        return view
    }


    /**
     * Read variable length Uint8Array.
     *
     * Important: The Uint8Array still points to the underlying ArrayBuffer. Make sure to discard the result as soon as possible to prevent any memory leaks.
     *            Use `buffer.copyUint8Array` to copy the result into a new Uint8Array.
     */
    readVarUint8Array() {
        const length = this.readVarUint()
        return this.readUint8Array(length)
    }

    /**
     * Read the rest of the content as an ArrayBuffer
     */
    readTailAsUint8Array() {
        return this.readUint8Array(this.data.length - this.position)
    }

    /**
     * Skip one byte, jump to the next position.
     */
    skip8() {
        this.position++
    } 

    /**
     * Read one byte as unsigned integer.
     */
    readUint8() {
        return this.data[this.position++]
    }

    /**
     * Read 2 bytes as unsigned integer.
     */
    readUint16() {
        const uint = 
            (this.data[this.position]) + 
            (this.data[this.position + 1] << 8)
        this.position += 2
        return uint
    }

    /**
     * Read 4 bytes as unsigned integer.
     */
    readUint32() {
        const uint =
            (this.data[this.position] +
            (this.data[this.position + 1] << 8) +
            (this.data[this.position + 2] << 16) +
            (this.data[this.position + 3] << 24)) >>> 0
            this.position += 4
        return uint
    }

    /**
     * Read 4 bytes as unsigned integer in big endian order.
     * (most significant byte first)
     */
    readUint32BigEndian() {
        const uint =
            (this.data[this.position + 3] +
            (this.data[this.position + 2] << 8) +
            (this.data[this.position + 1] << 16) +
            (this.data[this.position] << 24)) >>> 0
        this.position += 4
        return uint
    }

    /**
     * Look ahead without incrementing the position
     * to the next byte and read it as unsigned integer.
     */
    peekUint8() {
        return this.data[this.position]
    } 


    /**
     * Look ahead without incrementing the position
     * to the next byte and read it as unsigned integer.
     */
    peekUint16() {
        return (this.data[this.position]) +
               (this.data[this.position + 1] << 8)

    }

    /**
    * Look ahead without incrementing the position
    * to the next byte and read it as unsigned integer.
    */
    peekUint32() {
        return 
            (this.data[this.position] +
            (this.data[this.position + 1] << 8) +
            (this.data[this.position + 2] << 16) +
            (this.data[this.position + 3] << 24)) >>> 0
    }

    /**
    * Read unsigned integer (32bit) with variable length.
    * 1/8th of the storage is used as encoding overhead.
    *  * numbers < 2^7 is stored in one bytlength
    *  * numbers < 2^14 is stored in two bylength
    */
    readVarUint() {
        let num = 0
        let mult = 1
        const len = this.data.length
        while (this.position < len) {
            const r = this.data[this.position++]
            // num = num | ((r & binary.BITS7) << len)
            num = num + (r & 0b0111_1111) * mult // shift $r << (7*#iterations) and add it to num
            mult *= 128 // next iteration, shift 7 "more" to the left
            if (r < 0b1000_0000) {
                return num
            }
            /* istanbul ignore if */
            if (num > Number.MAX_SAFE_INTEGER) {
                throw errorIntegerOutOfRange
            }
        }
        throw errorUnexpectedEndOfArray
    }

    /**
    * Read signed integer (32bit) with variable length.
    * 1/8th of the storage is used as encoding overhead.
    *  * numbers < 2^7 is stored in one bytlength
    *  * numbers < 2^14 is stored in two bylength
    * @todo This should probably create the inverse ~num if number is negative - but this would be a breaking change.
    */
    readVarInt() {
        let r = this.data[this.position++]
        let num = r & 0b0011_1111
        let mult = 64
        const sign = (r & 0b0100_0000) > 0 ? -1 : 1
        if ((r & 0b1000_0000) === 0) {
            // don't continue reading
            return sign * num
        }
        const len = this.data.length
        while (this.position < len) {
            r = this.data[this.position++]
            // num = num | ((r & binary.BITS7) << len)
            num = num + (r & 0b0111_1111) * mult
            mult *= 128
            if (r < 0b1000_0000) {
                return sign * num
            }
            /* istanbul ignore if */
            if (num > Number.MAX_SAFE_INTEGER) {
                throw errorIntegerOutOfRange
            }
        }
        throw errorUnexpectedEndOfArray
    }

    /**
    * Look ahead and read varUint without incrementing position
    */
    peekVarUint() {
        const pos = this.position
        const s = this.readVarUint()
        this.position = pos
        return s
    }

    /**
    * Look ahead and read varUint without incrementing position
    */
    peekVarInt(): number {
        const pos = this.position
        const s = this.readVarInt()
        this.position = pos
        return s
    }

    /**
    * Read string of variable length
    * * varUint is used to store the length of the string
    */
    readVarString(): string {
        return Decoder._decoder.decode(this.readVarUint8Array())
    } 

        
    readFromDataView(length: number): DataView {
        const dataView = new DataView(
            this.data.buffer, this.data.byteOffset + this.position, length
        )
        this.position += length
        return dataView
    }
    
    readFloat32(): number {
        return this.readFromDataView(4).getFloat32(0, false)
    }
    
    readFloat64(): number {
        return this.readFromDataView(8).getFloat64(0, false)
    }
    
    readBigInt64(): bigint {
        return this.readFromDataView(8).getBigInt64(0, false)
    } 
    
    readBigUint64(): bigint {
        return this.readFromDataView(8).getBigUint64(0, false)
    }

    readAny(): Codable {
        const type = this.readUint8()

        if (type == 127) { return undefined }
        if (type == 126) { return null }
        if (type == 125) { return this.readVarInt() }
        if (type == 124) { return this.readFloat32() }
        if (type == 123) { return this.readFloat64() }
        if (type == 122) { return this.readBigInt64() }
        if (type == 121) { return false }
        if (type == 120) { return true }
        if (type == 119) { return this.readVarString() }
        if (type == 118) { 
            const len = this.readVarUint()
            /**
             * @type {Object<string,any>}
             */
            const obj: { [Key in string]: Codable } = {}
            for (let i = 0; i < len; i++) {
                const key = this.readVarString()
                obj[key] = this.readAny()
            }
            return obj
        }
        if (type == 117) {
            const len = this.readVarUint()
            const arr = []
            for (let i = 0; i < len; i++) {
                arr.push(this.readAny())
            }
            return arr
        }
        if (type == 116) {
            return undefined
        }
    }
}

export class RleDecoder<T extends number> extends Decoder {

    reader: (decoder: Decoder) => T
    state: T | null = null
    count = 0

    constructor (uint8Array: Uint8Array, reader: (decoder: Decoder) => T) {
        super(uint8Array)
        this.reader = reader
    }

    read(): T {
        if (this.count === 0) {
            this.state = this.reader(this)
            if (this.hasContent()) {
                this.count = this.readVarUint() + 1 // see encoder implementation for the reason why this is incremented
            } else {
                this.count = -1 // read the current value forever
            }
        }
        this.count--
        return this.state!
    }
}
  
export class IntDiffDecoder extends Decoder {

    state: number
    
    constructor(uint8Array: Uint8Array, start: number) {
        super(uint8Array)
        this.state = start
    }

    read(): number {
        this.state += this.readVarInt()
        return this.state
    }
}
  
export class RleIntDiffDecoder extends Decoder {
    state: number
    count: number

    constructor (uint8Array: Uint8Array, start: number) {
        super(uint8Array)
        this.state = start
        this.count = 0
    }

    read(): number {
        if (this.count === 0) {
            this.state += this.readVarInt()
            if (this.hasContent()) {
                this.count = this.readVarUint() + 1 // see encoder implementation for the reason why this is incremented
            } else {
                this.count = -1 // read the current value forever
            }
        }
        this.count--
        return this.state
    }
}

export class UintOptRleDecoder extends Decoder {
    state: number = 0
    count: number = 0

    constructor(uint8Array: Uint8Array) {
        super(uint8Array)
    }

    read(): number {
        if (this.count === 0) {
        this.state = this.readVarInt()
        // if the sign is negative, we read the count too, otherwise count is 1
        this.count = 1
        if (isNegative(this.state)) {
            this.state = -this.state
            this.count = this.readVarUint() + 2
        }
        }
        this.count--
        return this.state
    }
}
  
export class IncUintOptRleDecoder extends Decoder {
    state = 0
    count = 0
    constructor(uint8Array: Uint8Array) {
        super(uint8Array)
    }

    read(): number {
        if (this.count === 0) {
            this.state = this.readVarInt()
            // if the sign is negative, we read the count too, otherwise count is 1
            this.count = 1
            if (isNegative(this.state)) {
                this.state = -this.state
                this.count = this.readVarUint() + 2
            }
        }
        this.count--
        return this.state++
    }
}

export class IntDiffOptRleDecoder extends Decoder {
    state = 0
    count = 0
    diff = 0

    constructor(uint8Array: Uint8Array) {
        super(uint8Array)
    }

    read(): number {
        if (this.count === 0) {
            const diff = this.readVarInt()
            // if the first bit is set, we read more data
            const hasCount = diff & 1
            this.diff = Math.floor(diff / 2) // shift >> 1
            this.count = 1
            if (hasCount) {
                this.count = this.readVarUint() + 2
            }
        }
        this.state += this.diff
        this.count--
        return this.state
    }
}
  
export class StringDecoder {
    decoder: UintOptRleDecoder
    str: string
    spos: number = 0

    constructor(uint8Array: Uint8Array) {
        this.decoder = new UintOptRleDecoder(uint8Array)
        this.str = this.decoder.readVarString()
    }

    read(): string {
        const end = this.spos + this.decoder.read()
        const res = this.str.slice(this.spos, end)
        this.spos = end
        return res
    }
}
