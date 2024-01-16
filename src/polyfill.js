if (typeof TextEncoder !== 'function') {
    // required by @pixelbin/admin package
    const TextEncodingPolyfill = require('text-encoding');

    Object.assign(global, { TextEncoder: TextEncodingPolyfill.TextEncoder });
    Object.assign(global, { TextDecoder: TextEncodingPolyfill.TextDecoder });
}