import { Observable } from "./Observable";

describe("Encoder.ts", () => {
    test("onのテスト", () => {
        class A extends Observable {}

        interface A {
            on(name: "update", observer: (update: string) => void): void
            emit(name: "update", args: [string]): void
        }

        const a = new A()
        a.on("update", update => {
            expect(update).toBe("Hello")
        })
        a.emit("update", ["Hello"])
    })
    test("onceのテスト", () => {
        class A extends Observable {}

        interface A {
            on(name: "update", observer: (update: string) => void): void
            once(name: "update", observer: (update: string) => void): void

            emit(name: "update", args: [string]): void
        }

        const a = new A()
        a.once("update", update => {
            expect(update).toBe("Hello")
        })
        a.emit("update", ["Hello"])
        a.emit("update", ["Hello2"])
    })
})