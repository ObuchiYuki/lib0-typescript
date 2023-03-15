import { Bit, Bits } from "../Utility/binary"
import * as binary from "lib0/binary"
import { isNegativeZero } from "lib0/math"
import * as string from "lib0/string"

const errorUnexpectedEndOfArray = new Error('Unexpected end of array')
const errorIntegerOutOfRange = new Error('Integer out of Range')

export class Decoder {
    arr: Uint8Array
    pos: number = 0

    constructor (uint8Array: Uint8Array) { this.arr = uint8Array }

    hasContent(): boolean {
        return this.pos !== this.arr.length
    }

    clone(newPos: number = this.pos): Decoder {
        const _decoder = new Decoder(this.arr)
        _decoder.pos = newPos
        return _decoder
    }

    readUint8Array(len: number): Uint8Array {
        const view = new Uint8Array(this.arr.buffer, this.pos + this.arr.byteOffset, len)
        this.pos += len
        return view
    }

    readVarUint8Array(): Uint8Array {
        return this.readUint8Array(this.readVarUint())
    }

    readUint8(): number {
        return this.arr[this.pos++]
    }

    readVarUint(): number{
        let num = 0
        let mult = 1
        const len = this.arr.length
        while (this.pos < len) {
            const r = this.arr[this.pos++]
            num = num + (r & Bits.n7) * mult // shift $r << (7*#iterations) and add it to num
            mult *= 128 // next iteration, shift 7 "more" to the left
            if (r < Bit.n8) {
                return num
            }
            /* istanbul ignore if */
            if (num > Number.MAX_SAFE_INTEGER) {
                throw errorIntegerOutOfRange
            }
        }
        throw errorUnexpectedEndOfArray
    }
    
    readVarInt = (): number => {
        let r = this.arr[this.pos++]
        let num = r & Bits.n6
        let mult = 64
        const sign = (r & Bit.n7) > 0 ? -1 : 1
        if ((r & Bit.n8) === 0) {
            // don't continue reading
            return sign * num
        }
        const len = this.arr.length
        while (this.pos < len) {
            r = this.arr[this.pos++]
            // num = num | ((r & binary.BITS7) << len)
            num = num + (r & Bits.n7) * mult
            mult *= 128
            if (r < Bit.n8) {
                return sign * num
            }
            if (num > Number.MAX_SAFE_INTEGER) {
                throw errorIntegerOutOfRange
            }
        }
        throw errorUnexpectedEndOfArray
    }

    readVarString(): string {
        return  string.utf8TextDecoder!.decode(this.readVarUint8Array())
    }

    readFromDataView = (len: number): DataView => {
        const dv = new DataView(this.arr.buffer, this.arr.byteOffset + this.pos, len)
        this.pos += len
        return dv
    }    


    readFloat32() {
        return this.readFromDataView(4).getFloat32(0, false)
    }

    readFloat64() {
        return this.readFromDataView(8).getFloat64(0, false)
    }

    readBigInt64() {
        return this.readFromDataView(8).getBigInt64(0, false)
    }

    readBigUint64() {
        this.readFromDataView(8).getBigUint64(0, false)
    }

    readAny(): any {
        const typeid = this.readUint8()

        if (typeid == 127) return undefined
        if (typeid == 126) return null
        if (typeid == 125) return this.readVarInt()
        if (typeid == 124) return this.readFloat32()
        if (typeid == 123) return this.readFloat64()
        if (typeid == 122) return this.readBigInt64()
        if (typeid == 121) return false
        if (typeid == 120) return true
        if (typeid == 119) return this.readVarString()
        if (typeid == 118) {
            const len = this.readVarUint()
            const obj: { [s: string]: any } = {}
            for (let i = 0; i < len; i++) {
                const key = this.readVarString()
                obj[key] = this.readAny()
            }
            return obj
        }
        if (typeid == 117) {
            const len = this.readVarUint()
            const arr = []
            for (let i = 0; i < len; i++) {
                arr.push(this.readAny())
            }
            return arr
        }
        if (typeid == 116) {
            return this.readVarUint8Array()
        }

        return undefined
    }
    
}

export class RleDecoder<T extends number> {
    decoder: Decoder
    reader: (decoder: Decoder) => T
    state: T|null = null
    count = 0

    constructor(uint8Array: Uint8Array, reader: (arg0: Decoder) => T) {
        this.decoder = new Decoder(uint8Array)
        this.reader = reader
        this.state = null
        this.count = 0
    }

    read(): T {
        if (this.count === 0) {
            this.state = this.reader(this.decoder)
            if (this.decoder.hasContent()) {
                this.count = this.decoder.readVarUint() + 1 
            } else {
                this.count = -1 
            }
        }
        this.count--
        return this.state!
    }
}

export class IntDiffDecoder {
    decoder: Decoder
    state: number

    constructor (uint8Array: Uint8Array, start: number) {
        this.decoder = new Decoder(uint8Array)
        this.state = start
    }

    read(): number {
        this.state += this.decoder.readVarInt()
        return this.state
    }
}

export class RleIntDiffDecoder {
    decoder: Decoder
    state: number
    count = 0
    constructor (uint8Array: Uint8Array, start: number) {
        this.decoder = new Decoder(uint8Array)
        this.state = start
        this.count = 0
    }

    read(): number {
        if (this.count === 0) {
            this.state += this.decoder.readVarInt()
            if (this.decoder.hasContent()) {
                this.count = this.decoder.readVarUint() + 1 // see encoder implementation for the reason why this is incremented
            } else {
                this.count = -1 // read the current value forever
            }
        }
        this.count--
        return this.state
    }
}

export class UintOptRleDecoder {
    decoder: Decoder
    state = 0
    count = 0

    constructor (uint8Array: Uint8Array) {
        this.decoder = new Decoder(uint8Array)
    }

    read () {
        if (this.count === 0) {
            this.state = this.decoder.readVarInt()
            // if the sign is negative, we read the count too, otherwise count is 1
            const isNegative = isNegativeZero(this.state)
            this.count = 1
            if (isNegative) {
                this.state = -this.state
                this.count = this.decoder.readVarUint() + 2
            }
        }
        this.count--
        return this.state
    }
}

export class IncUintOptRleDecoder {
    decoder: Decoder
    state = 0
    count = 0

    constructor (uint8Array: Uint8Array) {
        this.decoder = new Decoder(uint8Array)
    }

    read () {
        if (this.count === 0) {
            this.state = this.decoder.readVarInt()
            // if the sign is negative, we read the count too, otherwise count is 1
            const isNegative = isNegativeZero(this.state)
            this.count = 1
            if (isNegative) {
                this.state = -this.state
                this.count = this.decoder.readVarUint() + 2
            }
        }
        this.count--
        return this.state++
    }
}

export class IntDiffOptRleDecoder {
    decoder: Decoder
    s = 0
    count = 0
    diff = 0

    constructor (uint8Array: Uint8Array) { 
        this.decoder = new Decoder(uint8Array)
    }

    /**
     * @return {number}
     */
    read (): number {
        if (this.count === 0) {
            const diff = this.decoder.readVarInt()
            // if the first bit is set, we read more data
            const hasCount = diff & 1
            this.diff = Math.floor(diff / 2) // shift >> 1
            this.count = 1
            if (hasCount) {
                this.count = this.decoder.readVarUint() + 2
            }
        }
        this.s += this.diff
        this.count--
        return this.s
    }
}

export class StringDecoder {
    decoder: UintOptRleDecoder
    str: string
    spos = 0

    constructor (uint8Array: Uint8Array) {
        this.decoder = new UintOptRleDecoder(uint8Array)
        this.str = this.decoder.decoder.readVarString()
    }

    read(): string {
        const end = this.spos + this.decoder.read()
        const res = this.str.slice(this.spos, end)
        this.spos = end
        return res
    }
}
