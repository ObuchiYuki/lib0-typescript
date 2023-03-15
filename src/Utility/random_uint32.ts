import { cryptoRandomBuffer } from 'isomorphic.js'

export const random_uint32 = () => new Uint32Array(cryptoRandomBuffer(4))[0]