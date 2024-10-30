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
			colors: {
				brand: {
					dark: '#184623',
					DEFAULT: '#4A8F5D',
					light: '#86C994'
				},
				secondary: {
					dark: '#0033A1',
					DEFAULT: '#2F8DCC',
					light: '#90C6EA'
				},
				accent: {
					white: '#FFFFFF',
					light: '#F3EFCD',
					DEFAULT: '#FFC919'
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

						'code::before': false,
						'code::after': false,
						code: {
							'border-radius': '0.25rem',
							padding: '0.15rem 0.3rem',
							borderWidth: '2px',
							borderColor: 'rgba(0,0,0,0.1)'
						},
						pre: {
							'border-radius': '0rem'
						},
						'a:hover': {
							color: '#31cdce !important',
							textDecoration: 'underline !important'
						},
						a: {
							color: '#2071ad',
							textDecoration: 'none'
						},
						'a code': {
							color: 'unset'
						},
						table: {
							overflow: 'hidden'
						},
						'li, ul, ol': {
							margin: 0
						},
						'li > img': {
							margin: 0,
							display: 'inline'
						},
						'ol > li::marker': {
							color: 'var(--tw-prose-body)'
						},
						'ul > li::marker': {
							color: 'var(--tw-prose-body)'
						},
						'ul > li > p': {
							marginTop: 0,
							marginBottom: 0
						}
					}
				}
			})
		}
	},
	daisyui: {
		themes: [
			{
				monkedao: {
					"primary": "#4A8F5D",
					"primary-focus": "#184623",
					"primary-content": "#FFFFFF",
					
					"secondary": "#2F8DCC",
					"secondary-focus": "#0033A1",
					"secondary-content": "#FFFFFF",
					
					"accent": "#FFC919",
					"accent-focus": "#F3EFCD",
					"accent-content": "#184623",
					
					"neutral": "#184623",
					"neutral-focus": "#4A8F5D",
					"neutral-content": "#F3EFCD",
					
					"base-100": "#FFFFFF",
					"base-200": "#F3EFCD",
					"base-300": "#86C994",
					"base-content": "#184623",
				},
				monkedao_dark: {
					"primary": "#4A8F5D",
					"primary-focus": "#86C994",
					"primary-content": "#F3EFCD",
					
					"secondary": "#2F8DCC",
					"secondary-focus": "#90C6EA",
					"secondary-content": "#F3EFCD",
					
					"accent": "#FFC919",
					"accent-focus": "#F3EFCD",
					"accent-content": "#184623",
					
					"neutral": "#F3EFCD",
					"neutral-focus": "#FFFFFF",
					"neutral-content": "#184623",
					
					"base-100": "#184623",
					"base-200": "#4A8F5D",
					"base-300": "#86C994",
					"base-content": "#F3EFCD",
				}
			}
		],
		darkTheme: "monkedao_dark",
	},
	variants: {},
	plugins: [require('@tailwindcss/typography'), require('daisyui')]
};
