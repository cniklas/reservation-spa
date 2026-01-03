import { defineConfig, presetMini, transformerDirectives } from 'unocss'

export default defineConfig({
	// custom CSS
	// missing in presetMini
	rules: [
		[
			'sr-only',
			{
				position: 'absolute',
				width: '1px',
				height: '1px',
				padding: 0,
				margin: '-1px',
				overflow: 'hidden',
				'clip-path': 'inset(50%)',
				'white-space': 'nowrap',
				'border-width': 0,
			},
		],
		['tabular-nums', { 'font-variant-numeric': 'tabular-nums' }],
	],

	shortcuts: {
		container: 'w-256 mx-auto max-w-full px-3 sm:px-4',
	},

	// https://unocss.dev/presets/mini
	presets: [presetMini()],
	// https://unocss.dev/transformers/directives
	transformers: [transformerDirectives()],
})
