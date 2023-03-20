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
exports.StringEncoder = exports.IntDiffOptRleEncoder = exports.IncUintOptRleEncoder = exports.UintOptRleEncoder = exports.RleIntDiffEncoder = exports.IntDiffEncoder = exports.RleEncoder = exports.Encoder = void 0;
const binary = __importStar(require("lib0/binary"));
const math_1 = require("lib0/math");
const string = __importStar(require("lib0/string"));
const _strBuffer = new Uint8Array(30000);
const _maxStrBSize = _strBuffer.length / 3;
const floatTestBed = new DataView(new ArrayBuffer(4));
class Encoder {
    constructor() {
        this.cpos = 0;
        this.cbuf = new Uint8Array(100);
        this.bufs = [];
    }
    get length() {
        let len = this.cpos;
        for (let i = 0; i < this.bufs.length; i++) {
            len += this.bufs[i].length;
        }
        return len;
    }
    toUint8Array() {
        const uint8arr = new Uint8Array(this.length);
        let curPos = 0;
        for (let i = 0; i < this.bufs.length; i++) {
            const d = this.bufs[i];
            uint8arr.set(d, curPos);
            curPos += d.length;
        }
        uint8arr.set(new Uint8Array(this.cbuf.buffer, 0, this.cpos), curPos);
        return uint8arr;
    }
    verifyLen(len) {
        const bufferLen = this.cbuf.length;
        if (bufferLen - this.cpos < len) {
            this.bufs.push(new Uint8Array(this.cbuf.buffer, 0, this.cpos));
            this.cbuf = new Uint8Array(Math.max(bufferLen, len) * 2);
            this.cpos = 0;
        }
    }
    write(num) {
        const bufferLen = this.cbuf.length;
        if (this.cpos === bufferLen) {
            this.bufs.push(this.cbuf);
            this.cbuf = new Uint8Array(bufferLen * 2);
            this.cpos = 0;
        }
        this.cbuf[this.cpos++] = num;
    }
    set(pos, num) {
        let buffer = null;
        // iterate all buffers and adjust position
        for (let i = 0; i < this.bufs.length && buffer === null; i++) {
            const b = this.bufs[i];
            if (pos < b.length) {
                buffer = b; // found buffer
            }
            else {
                pos -= b.length;
            }
        }
        if (buffer === null) {
            // use current buffer
            buffer = this.cbuf;
        }
        buffer[pos] = num;
    }
    writeUint8(value) {
        this.write(value);
    }
    writeVarUint(num) {
        while (num > binary.BITS7) {
            this.write(binary.BIT8 | (binary.BITS7 & num));
            num = Math.floor(num / 128); // shift >>> 7
        }
        this.write(binary.BITS7 & num);
    }
    writeVarInt(num) {
        const isNegative = (0, math_1.isNegativeZero)(num);
        if (isNegative) {
            num = -num;
        }
        //                         |- whether to continue reading                 |- whether is negative         |- number
        this.write((num > binary.BITS6 ? binary.BIT8 : 0) | (isNegative ? binary.BIT7 : 0) | (binary.BITS6 & num));
        num = Math.floor(num / 64); // shift >>> 6
        // We don't need to consider the case of num === 0 so we can use a different
        // pattern here than above.
        while (num > 0) {
            this.write((num > binary.BITS7 ? binary.BIT8 : 0) | (binary.BITS7 & num));
            num = Math.floor(num / 128); // shift >>> 7
        }
    }
    writeVarString(str) {
        if (str.length < _maxStrBSize) {
            // We can encode the string into the existing buffer
            /* istanbul ignore else */
            const written = string.utf8TextEncoder.encodeInto(str, _strBuffer).written || 0;
            this.writeVarUint(written);
            for (let i = 0; i < written; i++) {
                this.write(_strBuffer[i]);
            }
        }
        else {
            this.writeVarUint8Array(string.encodeUtf8(str));
        }
    }
    writeUint8Array(uint8Array) {
        const bufferLen = this.cbuf.length;
        const cpos = this.cpos;
        const leftCopyLen = Math.min(bufferLen - cpos, uint8Array.length);
        const rightCopyLen = uint8Array.length - leftCopyLen;
        this.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
        this.cpos += leftCopyLen;
        if (rightCopyLen > 0) {
            // Still something to write, write right half..
            // Append new buffer
            this.bufs.push(this.cbuf);
            // must have at least size of remaining buffer
            this.cbuf = new Uint8Array(Math.max(bufferLen * 2, rightCopyLen));
            // copy array
            this.cbuf.set(uint8Array.subarray(leftCopyLen));
            this.cpos = rightCopyLen;
        }
    }
    writeVarUint8Array(uint8Array) {
        this.writeVarUint(uint8Array.byteLength);
        this.writeUint8Array(uint8Array);
    }
    writeOnDataView(len) {
        this.verifyLen(len);
        const dview = new DataView(this.cbuf.buffer, this.cpos, len);
        this.cpos += len;
        return dview;
    }
    writeFloat32(num) {
        this.writeOnDataView(4).setFloat32(0, num, false);
    }
    writeFloat64(num) {
        this.writeOnDataView(8).setFloat64(0, num, false);
    }
    writeBigInt64(num) {
        this.writeOnDataView(8).setBigInt64(0, num, false);
    }
    writeBigUint64(num) {
        this.writeOnDataView(8).setBigUint64(0, num, false);
    }
    static isFloat32(num) {
        floatTestBed.setFloat32(0, num);
        return floatTestBed.getFloat32(0) === num;
    }
    writeAny(data) {
        switch (typeof data) {
            case 'string':
                // TYPE 119: STRING
                this.write(119);
                this.writeVarString(data);
                break;
            case 'number':
                if (Number.isInteger(data) && Math.abs(data) <= binary.BITS31) {
                    // TYPE 125: INTEGER
                    this.write(125);
                    this.writeVarInt(data);
                }
                else if (Encoder.isFloat32(data)) {
                    // TYPE 124: FLOAT32
                    this.write(124);
                    this.writeFloat32(data);
                }
                else {
                    // TYPE 123: FLOAT64
                    this.write(123);
                    this.writeFloat64(data);
                }
                break;
            case 'bigint':
                // TYPE 122: BigInt
                this.write(122);
                this.writeBigInt64(data);
                break;
            case 'object':
                if (data === null) {
                    // TYPE 126: null
                    this.write(126);
                }
                else if (data instanceof Array) {
                    // TYPE 117: Array
                    this.write(117);
                    this.writeVarUint(data.length);
                    for (let i = 0; i < data.length; i++) {
                        this.writeAny(data[i]);
                    }
                }
                else if (data instanceof Uint8Array) {
                    // TYPE 116: ArrayBuffer
                    this.write(116);
                    this.writeVarUint8Array(data);
                }
                else {
                    // TYPE 118: Object
                    this.write(118);
                    const keys = Object.keys(data);
                    this.writeVarUint(keys.length);
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        this.writeVarString(key);
                        this.writeAny(data[key]);
                    }
                }
                break;
            case 'boolean':
                // TYPE 120/121: boolean (true/false)
                this.write(data ? 120 : 121);
                break;
            default:
                // TYPE 127: undefined
                this.write(127);
        }
    }
}
exports.Encoder = Encoder;
class RleEncoder {
    constructor(writer) {
        this.encoder = new Encoder();
        this.writer = writer;
        this.s = null;
        this.count = 0;
    }
    write(v) {
        if (this.s === v) {
            this.count++;
        }
        else {
            if (this.count > 0) {
                this.encoder.writeVarUint(this.count - 1);
            }
            this.count = 1;
            this.writer(this.encoder, v);
            this.s = v;
        }
    }
}
exports.RleEncoder = RleEncoder;
class IntDiffEncoder {
    constructor(start) {
        this.encoder = new Encoder();
        this.s = start;
    }
    write(v) {
        this.encoder.writeVarInt(v - this.s);
        this.s = v;
    }
}
exports.IntDiffEncoder = IntDiffEncoder;
class RleIntDiffEncoder {
    constructor(start) {
        this.encoder = new Encoder();
        this.s = start;
        this.count = 0;
    }
    write(v) {
        if (this.s === v && this.count > 0) {
            this.count++;
        }
        else {
            if (this.count > 0) {
                this.encoder.writeVarUint(this.count - 1);
            }
            this.count = 1;
            this.encoder.writeVarInt(v - this.s);
            this.s = v;
        }
    }
}
exports.RleIntDiffEncoder = RleIntDiffEncoder;
const flushUintOptRleEncoder = (encoder) => {
    if (encoder.count > 0) {
        encoder.encoder.writeVarInt(encoder.count === 1 ? encoder.s : -encoder.s);
        if (encoder.count > 1) {
            encoder.encoder.writeVarUint(encoder.count - 2);
        }
    }
};
class UintOptRleEncoder {
    constructor() {
        this.encoder = new Encoder();
        this.s = 0;
        this.count = 0;
    }
    write(v) {
        if (this.s === v) {
            this.count++;
        }
        else {
            flushUintOptRleEncoder(this);
            this.count = 1;
            this.s = v;
        }
    }
    toUint8Array() {
        flushUintOptRleEncoder(this);
        return this.encoder.toUint8Array();
    }
}
exports.UintOptRleEncoder = UintOptRleEncoder;
class IncUintOptRleEncoder {
    constructor() {
        this.encoder = new Encoder();
        this.s = 0;
        this.count = 0;
    }
    write(v) {
        if (this.s + this.count === v) {
            this.count++;
        }
        else {
            flushUintOptRleEncoder(this);
            this.count = 1;
            this.s = v;
        }
    }
    toUint8Array() {
        flushUintOptRleEncoder(this);
        return this.encoder.toUint8Array();
    }
}
exports.IncUintOptRleEncoder = IncUintOptRleEncoder;
class IntDiffOptRleEncoder {
    constructor() {
        this.encoder = new Encoder();
        this.s = 0;
        this.count = 0;
        this.diff = 0;
        this.mutated = false;
    }
    write(v) {
        this.mutated = true;
        if (this.diff === v - this.s) {
            this.s = v;
            this.count++;
        }
        else {
            this.flush();
            this.count = 1;
            this.diff = v - this.s;
            this.s = v;
        }
    }
    toUint8Array() {
        if (this.mutated) {
            this.flush();
            this.mutated = false;
        }
        return this.encoder.toUint8Array();
    }
    flush() {
        if (this.count > 0) {
            const encodedDiff = this.diff * 2 + (this.count === 1 ? 0 : 1);
            this.encoder.writeVarInt(encodedDiff);
            if (this.count > 1) {
                this.encoder.writeVarUint(this.count - 2);
            }
        }
    }
}
exports.IntDiffOptRleEncoder = IntDiffOptRleEncoder;
class StringEncoder {
    constructor() {
        this.sarr = [];
        this.s = '';
        this.lensE = new UintOptRleEncoder();
    }
    write(string) {
        this.s += string;
        if (this.s.length > 19) {
            this.sarr.push(this.s);
            this.s = '';
        }
        this.lensE.write(string.length);
    }
    toUint8Array() {
        const encoder = new Encoder();
        this.sarr.push(this.s);
        this.s = '';
        encoder.writeVarString(this.sarr.join(''));
        encoder.writeUint8Array(this.lensE.toUint8Array());
        return encoder.toUint8Array();
    }
}
exports.StringEncoder = StringEncoder;
