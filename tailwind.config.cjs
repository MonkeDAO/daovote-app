/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/**/*.svelte',
		// may also want to include HTML files
		'./src/**/*.html'
	],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				space: ['"Space Grotesk"', 'sans-serif']
			},
			colors: {
				// Add our brand colors while preserving existing color config
				brand: {
					dark: '#1B4B28',    // Slightly deeper, richer dark green
					DEFAULT: '#4A8F5D', // Keeping main green
					light: '#8ED39B',   // Slightly adjusted light green for better contrast
				},
				accent: {
					DEFAULT: '#FFD23F', // Slightly warmer yellow
					light: '#F5F1E0',   // Warmer ivory
					white: '#FFFFFF',   // Keeping white
				},
				secondary: {
					dark: '#1A4B8C',    // Softer dark blue that's easier on the eyes
					DEFAULT: '#3B95D2', // Slightly adjusted blue
					light: '#A5D4F1',   // Lighter blue with better contrast
				}
			},
			typography: (theme) => ({
				DEFAULT: {
					css: {
						'--tw-prose-bullets': theme('colors.black'),
						// these customizations are explained here https://youtu.be/-FzemNMcOGs
						blockquote: {
							borderLeft: '3px solid red',
							fontSize: 'inherit',
							fontStyle: 'inherit',
							fontWeight: 'medium'
						},
						'blockquote p:first-of-type::before': {
							content: ''
						},
						'blockquote p:last-of-type::after': {
							content: ''
						},

						'code::before': {
							content: ''
						},
						'code::after': {
							content: ''
						},
						code: {
							color: 'var(--tw-prose-code)',
							backgroundColor: '#f3f4f6',
							borderRadius: '0.25rem',
							paddingLeft: '0.375rem',
							paddingRight: '0.375rem'
						}
					}
				},
				dark: {
					css: {
						color: theme('colors.gray.300'),
						'[class~="lead"]': {
							color: theme('colors.gray.300')
						},
						a: {
							color: theme('colors.yellow.500')
						},
						strong: {
							color: theme('colors.gray.100')
						},
						'ol > li::before': {
							color: theme('colors.gray.400')
						},
						'ul > li::before': {
							backgroundColor: theme('colors.gray.600')
						},
						hr: {
							borderColor: theme('colors.gray.200')
						},
						blockquote: {
							color: theme('colors.gray.200'),
							borderLeftColor: theme('colors.gray.600')
						},
						h1: {
							color: theme('colors.gray.100')
						},
						h2: {
							color: theme('colors.gray.100')
						},
						h3: {
							color: theme('colors.gray.100')
						},
						h4: {
							color: theme('colors.gray.100')
						},
						'figure figcaption': {
							color: theme('colors.gray.400')
						},
						code: {
							color: theme('colors.gray.100'),
							backgroundColor: theme('colors.gray.800')
						},
						'a code': {
							color: theme('colors.yellow.500')
						},
						pre: {
							color: theme('colors.gray.200'),
							backgroundColor: theme('colors.gray.800')
						},
						thead: {
							color: theme('colors.gray.100'),
							borderBottomColor: theme('colors.gray.600')
						},
						'tbody tr': {
							borderBottomColor: theme('colors.gray.700')
						}
					}
				}
			})
		}
	},
	variants: {},
	plugins: [require('@tailwindcss/typography'), require('daisyui')]
};
