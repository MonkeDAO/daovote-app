// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { ssp } from "sveltekit-search-params/plugin";
import nodePolyfills from 'rollup-plugin-node-polyfills';
import inject from "@rollup/plugin-inject";

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [ssp(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
		  stream: 'rollup-plugin-node-polyfills/polyfills/stream',
		  events: 'rollup-plugin-node-polyfills/polyfills/events',
		  assert: 'assert',
		  crypto: 'crypto-browserify',
		  util: 'util/',
		},
	  },
	  define: {
		'process.env': process.env ?? {},
	  },
	  build: {
		target: 'esnext',
		rollupOptions: {
		  plugins: [
			nodePolyfills({ crypto: true }),
			inject({ modules: { Buffer: ["buffer", "Buffer"] },}),
		  ],
		},
	  },
	  optimizeDeps: {
		include: ['svelte-pdf'],
		esbuildOptions: {
		define: {
			global: "globalThis",
		},
		//   plugins: [
		// 	NodeGlobalsPolyfillPlugin({ buffer: true }),
		//   ],
		}
	  },
	// optimizeDeps: {
	// 	include: ['@project-serum/anchor', '@solana/web3.js', 'buffer'],
	// 	// ... use the same implementation from the SvelteKit ui
	// },
	// define: {
	// 	'process.env': {}
	//   },
	server: {
		fs: {
			// https://vitejs.dev/config/server-options.html#server-fs-allow
			// allows importing readme for About page
			allow: ['..']
		}
	}
};

export default config;
