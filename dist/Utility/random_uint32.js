"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random_uint32 = void 0;
const isomorphic_js_1 = require("isomorphic.js");
const random_uint32 = () => new Uint32Array((0, isomorphic_js_1.cryptoRandomBuffer)(4))[0];
exports.random_uint32 = random_uint32;
