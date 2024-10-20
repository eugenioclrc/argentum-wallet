import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		
		extend: {
			colors: {
				avax: '#e84142'
			},
		}
	},

	plugins: [require('@tailwindcss/typography')]
} as Config;
