import { defineConfig, presetMini } from 'unocss'
import transformerDirectives from '@unocss/transformer-directives'

export default defineConfig({
	// custom CSS
	// missing in presetMini
	rules: [
		// ['overscroll-y-contain', { 'overscroll-behavior-y': 'contain' }],
		['scroll-m-20', { 'scroll-margin': '5rem' }],
		[
			'sr-only',
			{
				position: 'absolute',
				width: '1px',
				height: '1px',
				padding: '0',
				margin: '-1px',
				overflow: 'hidden',
				clip: 'rect(0, 0, 0, 0)',
				'white-space': 'nowrap',
				'border-width': '0',
			},
		],
	],

	shortcuts: {
		container: 'w-256 mx-auto max-w-full px-3 sm:px-4',
	},

	// https://unocss.dev/presets/mini
	presets: [presetMini()],
	// https://unocss.dev/transformers/directives
	transformers: [transformerDirectives()],
})
