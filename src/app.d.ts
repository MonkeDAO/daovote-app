/// <reference types="@sveltejs/kit" />

declare global {
    interface Window {
        crypto: Crypto;
    }
    
    var crypto: Crypto;
}

export {}; 