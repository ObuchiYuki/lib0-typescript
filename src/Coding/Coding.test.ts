import { Encoder } from "./Encoder"
import { Decoder } from "./Decoder"

import * as encoding from "lib0/encoding"
import { encode } from "punycode"

describe("Encoder.ts", () => {
    test("writeのデコード内容の比較", () => {
        const d1 = () => {
            const encoder = new Encoder()
            encoder.write(2)
            encoder.write(10)
            return encoder.toUint8Array()
        }
        const d2 = () => {
            const encoder = encoding.createEncoder()
            encoding.write(encoder, 2)
            encoding.write(encoder, 10)
            return encoding.toUint8Array(encoder)
        }
        expect(d1()).toEqual(d2())
    })

    test("int系の比較", () => {
        const d1 = () => {
            const encoder = new Encoder()
            encoder.writeUint8(9)
            return encoder.toUint8Array()
        }
        const d2 = () => {
            const encoder = encoding.createEncoder()
            encoding.writeUint8(encoder, 9)
            return encoding.toUint8Array(encoder)
        }
        expect(d1()).toEqual(d2())
    })

    test("writeVarIntの比較", () => {
        const d1 = () => {
            const encoder = new Encoder()
            encoder.writeVarInt(22)
            encoder.writeVarInt(12786127712)
            encoder.writeVarInt(-22)
            return encoder.toUint8Array()
        }
        const d2 = () => {
            const encoder = encoding.createEncoder()
            encoding.writeVarInt(encoder, 22)
            encoding.writeVarInt(encoder, 12786127712)
            encoding.writeVarInt(encoder, -22)
            return encoding.toUint8Array(encoder)
        }
        expect(d1()).toEqual(d2())
    })

    test("writeVarStringの比較", () => {
        const d1 = () => {
            const encoder = new Encoder()
            encoder.writeVarString("Hello World")
            return encoder.toUint8Array()
        }
        const d2 = () => {
            const encoder = encoding.createEncoder()
            encoding.writeVarString(encoder, "Hello World")
            return encoding.toUint8Array(encoder)
        }
        expect(d1()).toEqual(d2())
    })

    test("writeVarStringの比較", () => {
        const d1 = () => {
            const encoder = new Encoder()
            encoder.writeVarString("Hello World")
            return encoder.toUint8Array()
        }
        const d2 = () => {
            const encoder = encoding.createEncoder()
            encoding.writeVarString(encoder, "Hello World")
            return encoding.toUint8Array(encoder)
        }
        expect(d1()).toEqual(d2())
    })

    test("writeAnyの比較", () => {
        const d1 = () => {
            const encoder = new Encoder()
            encoder.writeAny({
                members: [
                    { name: "Alice", age: 16 },
                    { name: "Bob", age: 24 }
                ]
            })
            return encoder.toUint8Array()
        }
        const d2 = () => {
            const encoder = encoding.createEncoder()
            encoding.writeAny(encoder, {
                members: [
                    { name: "Alice", age: 16 },
                    { name: "Bob", age: 24 }
                ]
            })
            return encoding.toUint8Array(encoder)
        }
        expect(d1()).toEqual(d2())
    })
})

// ========================================================================================== //

describe("Decoder.ts", () => {
    test("writeのデコード内容の比較", () => {
        const encoder = new Encoder()
        encoder.write(2)
        encoder.write(10)
        const decoder = new Decoder(encoder.toUint8Array()) 
        
        expect(decoder.readUint8()).toBe(2)
        expect(decoder.readUint8()).toBe(10)
    })

    test("int系の比較", () => {
        const encoder = new Encoder()
        encoder.writeUint8(9)
        const decoder = new Decoder(encoder.toUint8Array()) 
        
        expect(decoder.readUint8()).toBe(9)
    })

    test("varIntの比較", () => {
        const encoder = new Encoder()
        encoder.writeVarInt(9)
        encoder.writeVarInt(12222)
        encoder.writeVarInt(12761287)
        
        const decoder = new Decoder(encoder.toUint8Array()) 
        
        expect(decoder.readVarInt()).toBe(9)
        expect(decoder.readVarInt()).toBe(12222)
        expect(decoder.readVarInt()).toBe(12761287)
    })

    test("varStringの比較", () => {
        const encoder = new Encoder()
        encoder.writeVarString("Hello")
        encoder.writeVarString("World")
        encoder.writeVarString("Encoder")

        const decoder = new Decoder(encoder.toUint8Array()) 
        
        expect(decoder.readVarString()).toBe("Hello")
        expect(decoder.readVarString()).toBe("World")
        expect(decoder.readVarString()).toBe("Encoder")
    })

    test("floatの比較", () => {
        const encoder = new Encoder()
        encoder.writeFloat32(3.14)
        
        console.log(encoder.toUint8Array())
        const decoder = new Decoder(encoder.toUint8Array()) 
        
        expect(decoder.readFloat32() - 3.14).toBeLessThanOrEqual(0.0001)
    })


    test("anyの比較", () => {
        const encoder = new Encoder()
        encoder.writeAny({
            member: [ { name: "Alice", age: 16 }, { name: "Bob", age: 24 }, { name: "Gaster", age: undefined } ]
        })

        const decoder = new Decoder(encoder.toUint8Array()) 
        expect(decoder.readAny()).toEqual({
            member: [ { name: "Alice", age: 16 }, { name: "Bob", age: 24 }, { name: "Gaster", age: undefined } ]
        })
    })

})