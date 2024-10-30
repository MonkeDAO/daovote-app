// Polyfill crypto for SSR
if (typeof global !== 'undefined' && !global.crypto) {
    global.crypto = {
        getRandomValues: (buffer: Uint8Array) => {
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
            }
            return buffer;
        }
    } as Crypto;
}

export {}; 