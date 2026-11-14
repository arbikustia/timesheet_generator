// Node globals missing from jsdom (TextEncoder/TextDecoder).
// jest/polyfills.cjs
const { TextDecoder, TextEncoder } = require("node:util");

globalThis.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;
