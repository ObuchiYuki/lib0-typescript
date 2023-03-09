"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("./Observable");
describe("Encoder.ts", () => {
    test("onのテスト", () => {
        class A extends Observable_1.Observable {
        }
        const a = new A();
        a.on("update", update => {
            expect(update).toBe("Hello");
        });
        a.emit("update", ["Hello"]);
    });
    test("onceのテスト", () => {
        class A extends Observable_1.Observable {
        }
        const a = new A();
        a.once("update", update => {
            expect(update).toBe("Hello");
        });
        a.emit("update", ["Hello"]);
        a.emit("update", ["Hello2"]);
    });
});
