"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringDecoder = exports.IntDiffOptRleDecoder = exports.IncUintOptRleDecoder = exports.UintOptRleDecoder = exports.RleIntDiffDecoder = exports.IntDiffDecoder = exports.RleDecoder = exports.Decoder = void 0;
const binary_1 = require("../Utility/binary");
const math_1 = require("lib0/math");
const string = __importStar(require("lib0/string"));
const errorUnexpectedEndOfArray = new Error('Unexpected end of array');
const errorIntegerOutOfRange = new Error('Integer out of Range');
class Decoder {
    constructor(uint8Array) {
        this.pos = 0;
        this.readVarInt = () => {
            let r = this.arr[this.pos++];
            let num = r & binary_1.Bits.n6;
            let mult = 64;
            const sign = (r & binary_1.Bit.n7) > 0 ? -1 : 1;
            if ((r & binary_1.Bit.n8) === 0) {
                // don't continue reading
                return sign * num;
            }
            const len = this.arr.length;
            while (this.pos < len) {
                r = this.arr[this.pos++];
                // num = num | ((r & binary.BITS7) << len)
                num = num + (r & binary_1.Bits.n7) * mult;
                mult *= 128;
                if (r < binary_1.Bit.n8) {
                    return sign * num;
                }
                if (num > Number.MAX_SAFE_INTEGER) {
                    throw errorIntegerOutOfRange;
                }
            }
            throw errorUnexpectedEndOfArray;
        };
        this.readFromDataView = (len) => {
            const dv = new DataView(this.arr.buffer, this.arr.byteOffset + this.pos, len);
            this.pos += len;
            return dv;
        };
        this.arr = uint8Array;
    }
    hasContent() {
        return this.pos !== this.arr.length;
    }
    clone(newPos = this.pos) {
        const _decoder = new Decoder(this.arr);
        _decoder.pos = newPos;
        return _decoder;
    }
    readUint8Array(len) {
        const view = new Uint8Array(this.arr.buffer, this.pos + this.arr.byteOffset, len);
        this.pos += len;
        return view;
    }
    readVarUint8Array() {
        return this.readUint8Array(this.readVarUint());
    }
    readUint8() {
        return this.arr[this.pos++];
    }
    readVarUint() {
        let num = 0;
        let mult = 1;
        const len = this.arr.length;
        while (this.pos < len) {
            const r = this.arr[this.pos++];
            num = num + (r & binary_1.Bits.n7) * mult; // shift $r << (7*#iterations) and add it to num
            mult *= 128; // next iteration, shift 7 "more" to the left
            if (r < binary_1.Bit.n8) {
                return num;
            }
            /* istanbul ignore if */
            if (num > Number.MAX_SAFE_INTEGER) {
                throw errorIntegerOutOfRange;
            }
        }
        throw errorUnexpectedEndOfArray;
    }
    readVarString() {
        return string.utf8TextDecoder.decode(this.readVarUint8Array());
    }
    readFloat32() {
        return this.readFromDataView(4).getFloat32(0, false);
    }
    readFloat64() {
        return this.readFromDataView(8).getFloat64(0, false);
    }
    readBigInt64() {
        return this.readFromDataView(8).getBigInt64(0, false);
    }
    readBigUint64() {
        this.readFromDataView(8).getBigUint64(0, false);
    }
    readAny() {
        const typeid = this.readUint8();
        if (typeid == 127)
            return undefined;
        if (typeid == 126)
            return null;
        if (typeid == 125)
            return this.readVarInt();
        if (typeid == 124)
            return this.readFloat32();
        if (typeid == 123)
            return this.readFloat64();
        if (typeid == 122)
            return this.readBigInt64();
        if (typeid == 121)
            return false;
        if (typeid == 120)
            return true;
        if (typeid == 119)
            return this.readVarString();
        if (typeid == 118) {
            const len = this.readVarUint();
            const obj = {};
            for (let i = 0; i < len; i++) {
                const key = this.readVarString();
                obj[key] = this.readAny();
            }
            return obj;
        }
        if (typeid == 117) {
            const len = this.readVarUint();
            const arr = [];
            for (let i = 0; i < len; i++) {
                arr.push(this.readAny());
            }
            return arr;
        }
        if (typeid == 116) {
            return this.readVarUint8Array();
        }
        return undefined;
    }
}
exports.Decoder = Decoder;
class RleDecoder {
    constructor(uint8Array, reader) {
        this.state = null;
        this.count = 0;
        this.decoder = new Decoder(uint8Array);
        this.reader = reader;
        this.state = null;
        this.count = 0;
    }
    read() {
        if (this.count === 0) {
            this.state = this.reader(this.decoder);
            if (this.decoder.hasContent()) {
                this.count = this.decoder.readVarUint() + 1;
            }
            else {
                this.count = -1;
            }
        }
        this.count--;
        return this.state;
    }
}
exports.RleDecoder = RleDecoder;
class IntDiffDecoder {
    constructor(uint8Array, start) {
        this.decoder = new Decoder(uint8Array);
        this.state = start;
    }
    read() {
        this.state += this.decoder.readVarInt();
        return this.state;
    }
}
exports.IntDiffDecoder = IntDiffDecoder;
class RleIntDiffDecoder {
    constructor(uint8Array, start) {
        this.count = 0;
        this.decoder = new Decoder(uint8Array);
        this.state = start;
        this.count = 0;
    }
    read() {
        if (this.count === 0) {
            this.state += this.decoder.readVarInt();
            if (this.decoder.hasContent()) {
                this.count = this.decoder.readVarUint() + 1; // see encoder implementation for the reason why this is incremented
            }
            else {
                this.count = -1; // read the current value forever
            }
        }
        this.count--;
        return this.state;
    }
}
exports.RleIntDiffDecoder = RleIntDiffDecoder;
class UintOptRleDecoder {
    constructor(uint8Array) {
        this.state = 0;
        this.count = 0;
        this.decoder = new Decoder(uint8Array);
    }
    read() {
        if (this.count === 0) {
            this.state = this.decoder.readVarInt();
            // if the sign is negative, we read the count too, otherwise count is 1
            const isNegative = (0, math_1.isNegativeZero)(this.state);
            this.count = 1;
            if (isNegative) {
                this.state = -this.state;
                this.count = this.decoder.readVarUint() + 2;
            }
        }
        this.count--;
        return this.state;
    }
}
exports.UintOptRleDecoder = UintOptRleDecoder;
class IncUintOptRleDecoder {
    constructor(uint8Array) {
        this.state = 0;
        this.count = 0;
        this.decoder = new Decoder(uint8Array);
    }
    read() {
        if (this.count === 0) {
            this.state = this.decoder.readVarInt();
            // if the sign is negative, we read the count too, otherwise count is 1
            const isNegative = (0, math_1.isNegativeZero)(this.state);
            this.count = 1;
            if (isNegative) {
                this.state = -this.state;
                this.count = this.decoder.readVarUint() + 2;
            }
        }
        this.count--;
        return this.state++;
    }
}
exports.IncUintOptRleDecoder = IncUintOptRleDecoder;
class IntDiffOptRleDecoder {
    constructor(uint8Array) {
        this.s = 0;
        this.count = 0;
        this.diff = 0;
        this.decoder = new Decoder(uint8Array);
    }
    /**
     * @return {number}
     */
    read() {
        if (this.count === 0) {
            const diff = this.decoder.readVarInt();
            // if the first bit is set, we read more data
            const hasCount = diff & 1;
            this.diff = Math.floor(diff / 2); // shift >> 1
            this.count = 1;
            if (hasCount) {
                this.count = this.decoder.readVarUint() + 2;
            }
        }
        this.s += this.diff;
        this.count--;
        return this.s;
    }
}
exports.IntDiffOptRleDecoder = IntDiffOptRleDecoder;
class StringDecoder {
    constructor(uint8Array) {
        this.spos = 0;
        this.decoder = new UintOptRleDecoder(uint8Array);
        this.str = this.decoder.decoder.readVarString();
    }
    read() {
        const end = this.spos + this.decoder.read();
        const res = this.str.slice(this.spos, end);
        this.spos = end;
        return res;
    }
}
exports.StringDecoder = StringDecoder;
